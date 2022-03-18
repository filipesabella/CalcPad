CalcPad is a different take on the calculator.

Runs on linux, mac, and windows.

![screenshot](https://user-images.githubusercontent.com/33415/158484266-0da3076b-1aaa-4f19-8001-dcb1612d37e8.png)

# Installation

Download the [latest release](https://github.com/filipesabella/CalcPad/releases/latest) for your platform.

## Web version

There's a slightly simpler web version [here](http://filipesabella.com/CalcPad/).

It doesn't do any kind of file handling or http requests, as everything is stored using the browser's LocalStorage.

It works ok on phones, and you can install it as an application.

# Functionality

## Editor

* Autocomplete with `ctrl+space`
* Multiple selections with `ctrl+d`
* Find & replace with `ctrl+f`

## Simple math

```
1 + 1
10 / .3
2 ^ 3
(10 + 5) / 7
```

## Assignments

```
salary = 100k
tax = 33
salaryAfterTax = tax% off salary
```

## Multipliers

```
1K
1M
1 billion
```

## Conversions

```
1 foot in meters
1 cup in tbs
```

All supported units [here](https://github.com/ben-ng/convert-units#supported-units).

## Percentages

```
10% of 100
10% off 100
10% on 100
```

## Constants

```
E / 2
PI * 3
```

## Ternary if statement

```
money = 5k
tax = money &gt; 5k ? 15 : 10
total = tax% off money
```

## Functions

```
sqrt(9)
round(1.4)

```

All supported functions:

```
abs acos asin atan atan2 ceil cos exp floor log max min pow random round sin sqrt tan
```

## Comments

```# a comment```


## External functions

In the menu _Edit -> Edit functions file_, you can declare any javascript function
that will become available to the editor itself.  
You must restart CalcPad after
editing that file for the changes to come into effect.
