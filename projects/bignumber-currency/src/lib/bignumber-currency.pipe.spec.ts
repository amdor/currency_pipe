import {BigNumberCurrencyPipe} from './bignumber-currency.pipe';
import {BigNumber} from 'bignumber.js';


describe('BigNumberCurrencyPipe', () => {
  let pipe: BigNumberCurrencyPipe;

  beforeEach(() => {
    // TestBed.configureTestingModule({});
    pipe = new BigNumberCurrencyPipe('en-US');
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });
  describe('transform', () => {
    it('should return correct value for numbers', () => {
      expect(pipe.transform(123)).toEqual('$123.00');
      expect(pipe.transform(12, 'EUR', 'code', '.1')).toEqual('EUR12.0');
      expect(pipe.transform(5.1234, 'USD', 'code', '.0-3')).toEqual('USD5.123');
      expect(pipe.transform(5.1234, 'USD', 'code')).toEqual('USD5.12');
      expect(pipe.transform(5.1234, 'USD', 'symbol')).toEqual('$5.12');
      expect(pipe.transform(5.1234, 'CAD', 'symbol')).toEqual('CA$5.12');
      expect(pipe.transform(5.1234, 'CAD', 'symbol-narrow')).toEqual('$5.12');
      expect(pipe.transform(5.1234, 'CAD', 'symbol-narrow', '5.2-2')).toEqual('$00,005.12');
    });

    it('should support any currency code name', () => {
      // currency code is unknown, default formatting options will be used
      expect(pipe.transform(5.1234, 'unexisting_ISO_code', 'symbol'))
        .toEqual('unexisting_ISO_code5.12');
      // currency code is USD, the pipe will format based on USD but will display "Custom name"
      expect(pipe.transform(5.1234, 'USD', 'Custom name')).toEqual('Custom name5.12');
    });

    it('should not support other objects', () => {
      // @ts-ignore purposefully giving wrong input
      expect(() => pipe.transform({}))
        .toThrowError(
          `InvalidPipeArgument: '[object Object] is not a number' for pipe 'BigNumberCurrencyPipe'`);
    });

    it('should warn if you are using the v4 signature', () => {
      const warnSpy = spyOn(console, 'warn');
      pipe.transform(123, 'USD', true);
      expect(warnSpy).toHaveBeenCalledWith(
        `Warning: the currency pipe has been changed in Angular v5. The symbolDisplay option (third parameter) is now a string instead of a boolean. The accepted values are "code", "symbol" or "symbol-narrow".`);
    });
  });

  it('should return correct value for big numbers', () => {
    expect(pipe.transform('123456789012345678.90')).toEqual('$123,456,789,012,345,678.90');
    expect(pipe.transform(new BigNumber(123))).toEqual('$123.00');
    expect(pipe.transform(new BigNumber('123.500'))).toEqual('$123.50');
    expect(pipe.transform(new BigNumber('123000'))).toEqual('$123,000.00');
    const big = new BigNumber('123.500');
    pipe.transform(big);
    expect(big).toEqual(new BigNumber('123.500'));
  });

});
