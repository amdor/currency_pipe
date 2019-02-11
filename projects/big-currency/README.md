# BigCurrency

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.2.0.

## Purpose
Originally Angular CurrencyPipe does not let you use big numbers, they rely on JavaScript number precision. This Angular library solves that issue.

## Usage
After installing with
```
npm i big-currency
```
import the module in your AppModule
```typescript
@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BigCurrencyModule
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}
```
then you can use it as if using [CurrencyPipe](https://angular.io/api/common/CurrencyPipe), but instead of 
``` | currency```
use
``` | bigCurrency```


The package uses [big.js](https://github.com/MikeMcl/big.js), so you can fine-tune precision with Big properties sucha as DP and PE.
