// HW-21: this test fails on purpose, to show that a failing test puts a red cross on
// the pull request. The next commit removes it.
it('fails on purpose to show the red cross', () => {
  expect(1 + 1).toBe(3);
});
