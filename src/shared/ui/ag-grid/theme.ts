import { colorSchemeDark, themeQuartz } from 'ag-grid-community';

export const darkGridTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  dataBackgroundColor: 'rgb(15, 23, 42)',
  oddRowBackgroundColor: 'rgb(2, 6, 23)',
  headerBackgroundColor: 'rgb(31, 41, 55)',
  headerTextColor: 'rgb(243, 244, 246)',
  cellTextColor: 'rgb(243, 244, 246)',
  borderColor: 'rgb(51, 65, 85)',
  rowHoverColor: 'rgba(148, 163, 184, 0.15)',
});
