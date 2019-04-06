/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  getLocaleNumberFormat,
  getLocaleNumberSymbol,
  getNumberOfCurrencyDigits,
  NumberFormatStyle,
  NumberSymbol
} from '@angular/common';
import {BigNumber} from 'bignumber.js';

export const NUMBER_FORMAT_REGEXP = /^(\d+)?\.((\d+)(-(\d+))?)?$/;
const DECIMAL_SEP = '.';
const ZERO_CHAR = '0';
const PATTERN_SEP = ';';
const GROUP_SEP = ',';
const DIGIT_CHAR = '#';
const CURRENCY_CHAR = '¤';
const HALF_UP = 4;

/**
 * Transforms a number to a locale string based on a style and a format
 */
function formatNumberToLocaleString(
  value: BigNumber, pattern: ParsedNumberFormat, locale: string, groupSymbol: NumberSymbol,
  decimalSymbol: NumberSymbol, digitsInfo?: string): string {
  let formattedText;
  let isZero;
  let parsedNumber = value;

  let minInt = pattern.minInt;
  let minFraction = pattern.minFrac;
  let maxFraction = pattern.maxFrac;

  if (digitsInfo) {
    const parts = digitsInfo.match(NUMBER_FORMAT_REGEXP);
    if (parts === null) {
      throw new Error(`${digitsInfo} is not a valid digit info`);
    }
    const minIntPart = parts[1];
    const minFractionPart = parts[3];
    const maxFractionPart = parts[5];
    if (minIntPart != null) {
      minInt = parseIntAutoRadix(minIntPart);
    }
    if (minFractionPart != null) {
      minFraction = parseIntAutoRadix(minFractionPart);
    }
    if (maxFractionPart != null) {
      maxFraction = parseIntAutoRadix(maxFractionPart);
    } else if (minFractionPart != null && minFraction > maxFraction) {
      maxFraction = minFraction;
    }
  }

  let exponent = 0;
  // @ts-ignore API says this is the way
  const exponentialAt = BigNumber.config().EXPONENTIAL_AT;
  if ((exponentialAt.length && exponentialAt[1] <= parsedNumber.e) || exponentialAt <= parsedNumber.e) {
    parsedNumber = value.div(Math.pow(10, value.e));
    exponent = parsedNumber.e;
  }

  let digits = roundNumber(parsedNumber, minFraction, maxFraction);
  let integerLen = parsedNumber.e + 1;
  let decimals = [];

  // pad zeros for small numbers
  for (; integerLen < minInt; integerLen++) {
    digits.unshift('0');
  }

  // pad zeros for small numbers
  for (; integerLen < 0; integerLen++) {
    digits.unshift('0');
  }

  // extract decimals digits
  if (integerLen > 0) {
    decimals = digits.splice(integerLen, digits.length);
  } else {
    decimals = digits;
    digits = ['0'];
  }

  // format the integer digits with grouping separators
  const groups = [];
  if (digits.length >= pattern.lgSize) {
    groups.unshift(digits.splice(-pattern.lgSize, digits.length).join(''));
  }

  while (digits.length > pattern.gSize) {
    groups.unshift(digits.splice(-pattern.gSize, digits.length).join(''));
  }

  if (digits.length) {
    groups.unshift(digits.join(''));
  }

  formattedText = groups.join(getLocaleNumberSymbol(locale, groupSymbol));

  // append the decimal digits
  if (decimals.length) {
    formattedText += getLocaleNumberSymbol(locale, decimalSymbol) + decimals.join('');
  }

  if (exponent) {
    formattedText += getLocaleNumberSymbol(locale, NumberSymbol.Exponential) + '+' + exponent;
  }

  if (value.isNegative() && !value.isZero()) {
    formattedText = pattern.negPre + formattedText + pattern.negSuf;
  } else {
    formattedText = pattern.posPre + formattedText + pattern.posSuf;
  }

  return formattedText;
}

/**
 * @ngModule BignumberCurrencyModule
 * @description
 *
 * Formats a number as currency using locale rules.
 *
 * Use `currency` to format a number as currency.
 *
 * Where:
 * - `value` is a number.
 * - `locale` is a `string` defining the locale to use.
 * - `currency` is the string that represents the currency, it can be its symbol or its name.
 * - `currencyCode` is the [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) currency code, such
 *    as `USD` for the US dollar and `EUR` for the euro.
 * - `digitInfo` See {@link DecimalPipe} for more details.
 *
 * @publicApi
 */
export function formatCurrency(
  value: BigNumber, locale: string, currency: string, currencyCode?: string,
  digitsInfo?: string): string {
  const format = getLocaleNumberFormat(locale, NumberFormatStyle.Currency);
  const pattern = parseNumberFormat(format, getLocaleNumberSymbol(locale, NumberSymbol.MinusSign));

  pattern.minFrac = getNumberOfCurrencyDigits(currencyCode !);
  pattern.maxFrac = pattern.minFrac;

  const res = formatNumberToLocaleString(
    value, pattern, locale, NumberSymbol.CurrencyGroup, NumberSymbol.CurrencyDecimal, digitsInfo);
  return res
    .replace(CURRENCY_CHAR, currency)
    // if we have 2 time the currency character, the second one is ignored
    .replace(CURRENCY_CHAR, '');
}

interface ParsedNumberFormat {
  minInt: number;
  // the minimum number of digits required in the fraction part of the number
  minFrac: number;
  // the maximum number of digits required in the fraction part of the number
  maxFrac: number;
  // the prefix for a positive number
  posPre: string;
  // the suffix for a positive number
  posSuf: string;
  // the prefix for a negative number (e.g. `-` or `(`))
  negPre: string;
  // the suffix for a negative number (e.g. `)`)
  negSuf: string;
  // number of digits in each group of separated digits
  gSize: number;
  // number of digits in the last group of digits before the decimal separator
  lgSize: number;
}


function parseNumberFormat(format: string, minusSign = '-'): ParsedNumberFormat {
  const p = {
    minInt: 1,
    minFrac: 0,
    maxFrac: 0,
    posPre: '',
    posSuf: '',
    negPre: '',
    negSuf: '',
    gSize: 0,
    lgSize: 0
  };

  const patternParts = format.split(PATTERN_SEP);
  const positive = patternParts[0];
  const negative = patternParts[1];

  const positiveParts = positive.indexOf(DECIMAL_SEP) !== -1 ?
    positive.split(DECIMAL_SEP) :
    [
      positive.substring(0, positive.lastIndexOf(ZERO_CHAR) + 1),
      positive.substring(positive.lastIndexOf(ZERO_CHAR) + 1)
    ];
  const integer = positiveParts[0];
  const fraction = positiveParts[1] || '';

  p.posPre = integer.substr(0, integer.indexOf(DIGIT_CHAR));

  for (let i = 0; i < fraction.length; i++) {
    const ch = fraction.charAt(i);
    if (ch === ZERO_CHAR) {
      p.minFrac = p.maxFrac = i + 1;
    } else if (ch === DIGIT_CHAR) {
      p.maxFrac = i + 1;
    } else {
      p.posSuf += ch;
    }
  }

  const groups = integer.split(GROUP_SEP);
  p.gSize = groups[1] ? groups[1].length : 0;
  p.lgSize = (groups[2] || groups[1]) ? (groups[2] || groups[1]).length : 0;

  if (negative) {
    const trunkLen = positive.length - p.posPre.length - p.posSuf.length;
    const pos = negative.indexOf(DIGIT_CHAR);

    p.negPre = negative.substr(0, pos).replace(/'/g, '');
    p.negSuf = negative.substr(pos + trunkLen).replace(/'/g, '');
  } else {
    p.negPre = minusSign + p.posPre;
    p.negSuf = p.posSuf;
  }

  return p;
}

/**
 * Round the parsed number to the specified number of decimal places
 * This function changes the parsedNumber in-place
 */
function roundNumber(parsedNumber: BigNumber, minFrac: number, maxFrac: number): string[] {
  if (minFrac > maxFrac) {
    throw new Error(
      `The minimum number of digits after fraction (${minFrac}) is higher than the maximum (${maxFrac}).`);
  }
  const usefulDigitsLength = getDigits(parsedNumber).length;
  const parsedIntegerLength = parsedNumber.e + 1;
  const fractionLen = usefulDigitsLength - parsedIntegerLength;
  const desiredFractionSize = Math.min(Math.max(minFrac, fractionLen), maxFrac) + parsedIntegerLength;
  return strArrayToNumStrArray([parsedNumber.toPrecision(desiredFractionSize, HALF_UP)]);
}

// returns the digits in an array where every digit is an element, and there are no unnecessary zeros in the fraction
function getDigits(big: BigNumber): string[] {
  const cStringArray = big.c.map((current: number) => current.toString());
  // last number might contain unnecessary zeros, only unnecessary if not integer
  if (!big.isInteger()) {
    const lastElem = cStringArray[cStringArray.length - 1];
    let subStrEnd = lastElem.length;
    while (lastElem.charAt(subStrEnd - 1) === '0') {
      subStrEnd--;
    }
    cStringArray[cStringArray.length - 1] = lastElem.substring(0, subStrEnd);
  }

  return strArrayToNumStrArray(cStringArray);
}

// string array with only 1 digit numbers in it
function strArrayToNumStrArray(strArray: string[]): string[] {
  // we have an array of string number, but want number digits ['12,3', '45'] => [1,2,3,4,5]
  const retArray = [];
  strArray.forEach((supposedNumString: string) => {
    const realNumString = supposedNumString.replace(/\D/g, '');
    const partialRetArr = realNumString.split('');
    for (const numStr of partialRetArr) {
      retArray.push(numStr);
    }
  });
  return retArray;
}

export function parseIntAutoRadix(text: string): number {
  const result: number = parseInt(text);
  if (isNaN(result)) {
    throw new Error('Invalid integer literal when parsing ' + text);
  }
  return result;
}
