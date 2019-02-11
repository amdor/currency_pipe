/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Inject, LOCALE_ID, Pipe, PipeTransform} from '@angular/core';
import {formatCurrency} from './i18n/format_number';
import {invalidPipeArgumentError} from './invalid_pipe_argument_error';
import Big from 'big.js';
import {getCurrencySymbol} from '@angular/common';

/**
 * @ngModule BigCurrencyPipeModule
 * @description
 *
 * Transforms a number to a currency string, formatted according to locale rules
 * that determine group sizing and separator, decimal-point character,
 * and other locale-specific configurations.
 *
 * @see `getCurrencySymbol()`
 * @see `formatCurrency()`
 *
 * @publicApi
 */
@Pipe({
  name: 'bigCurrency'
})
export class BigCurrencyPipe implements PipeTransform {
  constructor(@Inject(LOCALE_ID) private _locale: string) {
  }

  /**
   *
   * @param value The number to be formatted as currency.
   * @param currencyCode The [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) currency code,
   * such as `USD` for the US dollar and `EUR` for the euro.
   * @param display The format for the currency indicator. One of the following:
   *   - `code`: Show the code (such as `USD`).
   *   - `symbol`(default): Show the symbol (such as `$`).
   *   - `symbol-narrow`: Use the narrow symbol for locales that have two symbols for their
   * currency.
   * For example, the Canadian dollar CAD has the symbol `CA$` and the symbol-narrow `$`. If the
   * locale has no narrow symbol, uses the standard symbol for the locale.
   *   - String: Use the given string value instead of a code or a symbol.
   * For example, an empty string will suppress the currency & symbol.
   *   - Boolean (marked deprecated in v5): `true` for symbol and false for `code`.
   *
   * @param digitsInfo Decimal representation options, specified by a string
   * in the following format:<br>
   * <code>{minIntegerDigits}.{minFractionDigits}-{maxFractionDigits}</code>.
   *   - `minIntegerDigits`: The minimum number of integer digits before the decimal point.
   * Default is `1`.
   *   - `minFractionDigits`: The minimum number of digits after the decimal point.
   * Default is `2`.
   *   - `maxFractionDigits`: The maximum number of digits after the decimal point.
   * Default is `2`.
   * If not provided, the number will be formatted with the proper amount of digits,
   * depending on what the [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) specifies.
   * For example, the Canadian dollar has 2 digits, whereas the Chilean peso has none.
   * @param locale A locale code for the locale format rules to use.
   * When not supplied, uses the value of `LOCALE_ID`, which is `en-US` by default.
   * See [Setting your app locale](guide/i18n#setting-up-the-locale-of-your-app).
   */
  transform(
    value: string | number | Big, currencyCode?: string,
    display: 'code' | 'symbol' | 'symbol-narrow' | string | boolean = 'symbol', digitsInfo?: string,
    locale?: string): string | null {
    if (isEmpty(value)) {
      return null;
    }

    locale = locale || this._locale;

    if (typeof display === 'boolean') {
      if (console as any && console.warn as any) {
        console.warn(
          `Warning: the currency pipe has been changed in Angular v5. The symbolDisplay option (third parameter) is now a string instead of a boolean. The accepted values are "code", "symbol" or "symbol-narrow".`);
      }
      display = display ? 'symbol' : 'code';
    }

    let currency: string = currencyCode || 'USD';
    if (display !== 'code') {
      if (display === 'symbol' || display === 'symbol-narrow') {
        currency = getCurrencySymbol(currency, display === 'symbol' ? 'wide' : 'narrow', locale);
      } else {
        currency = display;
      }
    }

    try {
      const num = strToNumber(value);
      return formatCurrency(num, locale, currency, currencyCode, digitsInfo);
    } catch (error) {
      throw invalidPipeArgumentError(BigCurrencyPipe, error.message);
    }
  }
}

function isEmpty(value: any): boolean {
  return value == null || value === '' || value !== value;
}

/**
 * Transforms a string into a number (if needed).
 */
function strToNumber(value: number | string | Big): Big {
  // Convert strings to numbers
  if (typeof value === 'string' || typeof value === 'number') {
    return Big(value);
  }
  if (typeof value !== 'object' || value.constructor.name !== 'Big') {
    throw new Error(`${value} is not a number`);
  }
  return value;
}
