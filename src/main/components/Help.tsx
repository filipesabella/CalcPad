import * as React from 'react';
import '../styles/Help.less';

interface Props {
  close: () => void;
}

export const Help = (props: Props) => {
  return <div className="help">
    <h1>Editor</h1>
    <p>
      - Autocomplete with <code>ctrl+space</code><br />
      - Multiple selections with <code>ctrl+d</code><br />
      - Find & replace with <code>ctrl+f</code>
    </p>

    <h1>Simple math</h1>
    <p><code>1 + 1</code></p>
    <p><code>10 / .3</code></p>
    <p><code>2 ^ 3</code></p>
    <p><code>(10 + 5) / 7</code></p>

    <h1>Comments</h1>
    <p><code># a comment</code></p>

    <h1>Assignments</h1>
    <p><code>salary = 100k</code></p>
    <p><code>tax = 33</code></p>
    <p><code>salaryAfterTax = tax% off salary</code></p>

    <h1>Multipliers</h1>
    <p><code>1K</code></p>
    <p><code>1M</code></p>
    <p><code>1 billion</code></p>

    <h1>Conversions</h1>
    <p><code>1 foot in meters</code></p>
    <p><code>1 cup in tbs</code></p>
    <p>
      All supported units&nbsp;
      <a
        target="blank"
        href="https://github.com/convert-units/convert-units#request-measures--units">
        here
      </a>.
    </p>

    <h1>Percentages</h1>
    <p><code>10% of 100</code></p>
    <p><code>10% off 100</code></p>
    <p><code>10% on 100</code></p>

    <h1>Constants</h1>
    <p><code>E / 2</code></p>
    <p><code>PI * 3</code></p>

    <h1>Ternary if statement</h1>
    <p><code>money = 5k</code></p>
    <p><code>tax = money &gt; 5k ? 15 : 10</code></p>
    <p><code>total = tax% off money</code></p>

    <h1>Functions</h1>
    <p><code>sqrt(9)</code></p>
    <p><code>round(1.4)</code></p>
    <p>All supported functions:</p>
    <p>
      <code>
        abs
        acos
        asin
        atan
        atan2
        ceil
        cos
        exp
        floor
        log
        max
        min
        pow
        random
        round
        sin
        sqrt
        tan
      </code>
    </p>

    <h1>External functions</h1>
    <p>
      In the menu <i>Edit -&gt; Edit functions file</i>, you can declare any javascript
      function that will become available to the editor itself.
    </p>
    <p>
      You must restart CalcPad after editing that file for the changes to come
      into effect.
    </p>
    <div
      className="closeButton"
      onClick={_ => props.close()}>Close</div>
  </div>;
};
