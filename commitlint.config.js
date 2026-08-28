module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [(commit) => commit.includes('Signed-off-by: dependabot[bot]')]
}
