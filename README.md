# gsm.viz
[gsm.viz](https://github.com/Gilead-BioStats/gsm.viz/) is a data visualization library built with
[Chart.js](https://www.chartjs.org/) that features charts adapted for
[risk-based monitoring](https://www.fda.gov/media/121479/download) in clinical trials.

## Examples
Production examples of `gsm.viz` modules are accessible [here](https://gilead-biostats.github.io/gsm.viz/)
and development examples [here](https://gilead-biostats.github.io/gsm.viz/dev/).

- [scatter plot](https://gilead-biostats.github.io/gsm.viz/scatterPlot/)
- [bar chart](https://gilead-biostats.github.io/gsm.viz/barChart/)
- [time series](https://gilead-biostats.github.io/gsm.viz/timeSeriesContinuous/)
- [sparkline](https://gilead-biostats.github.io/gsm.viz/sparkline/)
- [site overview](https://gilead-biostats.github.io/gsm.viz/siteOverview/)
- [country overview](https://gilead-biostats.github.io/gsm.viz/groupOverview/)

## Installation

`gsm.viz` is hosted on GitHub and accessible with `npm`:

```
npm install git+https://github.com/Gilead-BioStats/gsm.viz.git
```

## Contributor Guidelines

### Installation

Clone `gsm.viz` with `git` and install its dependencies:

```
git clone https://github.com/Gilead-BioStats/gsm.viz.git
cd gsm.viz
npm install
```

### Version Control

Development branches should resolve a specific issue and be named accordingly.  For instance, branch
`fix-123` should resolve issue #123 on GitHub:

```
git checkout -b fix-123
```

### Development Basics

The codebase is comprised of files under `./src`.  Each file should generally contain a single
function, or module.  Upon updating a file, the library needs to be re-bundled:

```
npm run bundle
```

Upon completion of the update to the codebase, rebuild the library and push your branch to GitHub:

```
npm run build
git add -A
git commit -a -m 'fix #123'
git push -u origin fix-123
```

On GitHub, open a [pull request](https://github.com/Gilead-BioStats/gsm.viz/pulls) with `fix-123` as
the source and `dev` as the target.  The pull request requires a code review prior to merging.

## Update Example Data

- edit csv files in `examples/data/`

```
node examples/data/helpers/csv-to-json.js
```
## Run Unit Tests

```
npm run test
```


### Advanced Development Methods

To expedite development the code can be actively bundled as changes are made to the source code. In
a terminal run the following command:

```
npm run watch
```

Now each change to the codebase is automatically reflected in the code bundle. To view changes in
the browser open another terminal and run the following command:

```
npm run local
```

The repository is now accessible via the browser.  Navigate to `./examples` to view a list of
existing modules.  Each example contains a working instance of each `gsm.viz` module.  Open the
appropriate example to view changes to the module in real time as you develop.


