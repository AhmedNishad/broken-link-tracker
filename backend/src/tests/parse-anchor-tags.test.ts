
const findLinkTagCount = (html: string) : number => {
  return 0;
}

const testHTMLWithOneLink = `
<html>
  <head></head>
  <body>
    <a href="click.html">Click me</a>
  </body>
</html>
`

const testHTMLWithNoLinks = `
<html>
  <head></head>
  <body>
  </body>
</html>
`;

test('finds 0 anchor tags in empty html document', () => {
  expect(findLinkTagCount("")).toBe(0);
});

test('finds 0 anchor tags in html document', () => {
  expect(findLinkTagCount(testHTMLWithNoLinks)).toBe(0);
});

test('finds 1 anchor tags in html document', () => {
  expect(findLinkTagCount(testHTMLWithOneLink)).toBe(1);
});