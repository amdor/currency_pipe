# BigNumberCurrency

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.2.0.

## Purpose
Originally Angular CurrencyPipe does not let you use big numbers, they rely on JavaScript number precision. This Angular library solves that issue.

## Usage
After installing with
```
npm i bignumber-currency
```
import the module in your AppModule
```typescript
@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BigNumberCurrencyModule
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}
```
then you can use it as if using [CurrencyPipe](https://angular.io/api/common/CurrencyPipe), but instead of 
``` | currency```
use
``` | bigNumberCurrency``` the difference is that you can pass a BigNumber as input (or anything else originally supported of course). See [tests](https://github.com/amdor/currency_pipe/blob/master/projects/bignumber-currency/src/lib/bignumber-currency.pipe.spec.ts) for examples.


The package uses [bignumber.js](https://github.com/MikeMcl/bignumber.js), so you can fine-tune precision with BigNumber's properties and config.
