# durationinput
jQuery-plugin to make text-input ready for duration-values like 4h or 10min

***

### Requirements

* jQuery >=1.6

***

### Installation

Bower:

```
bower install debrouchee/durationinput --save-dev
```

Or download js/simpletooltip.min.js and include the script on your page like shown below.

***

### Usage

Include script:

```html
<script src="durationinput.min.js"></script>
```

Markup (example):

```html
<input type="text">
```

Initialize:

```javacript
$(function() {
  $('input[type="text"]').durationinput(options);
});
```

***

### Options

Look at js-file.