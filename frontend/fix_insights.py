with open('src/components/InsightsPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('const loading = goalsLoading || insightsLoading || txLoading;', 'const loading = false; // decoupled')
c = c.replace('{error && !loading && (', '{error && (')
c = c.replace('      {/* Loading State */}\n      {loading ? (\n        <div className=\"loading-container\">\n          <div className=\"spinner\"></div>\n          <p>Loading your insights and goals...</p>\n        </div>\n      ) : (\n        <>\n', '')
c = c.replace('        </>\n      )}\n    </div>\n  );\n};\n\nexport default InsightsPage;', '    </div>\n  );\n};\n\nexport default InsightsPage;')
c = c.replace('{refreshing ? (\n                  <div className=\"loading-text\">', '{insightsLoading || refreshing ? (\n                  <div className=\"loading-text\">')
c = c.replace('<p>Generating insights...</p>', '<p>{refreshing ? \"Generating insights...\" : \"Loading insights...\"}</p>')
c = c.replace('              <div className=\"card-body\">\n                {savingsGoals.length > 0 ? (', '              <div className=\"card-body\">\n                {goalsLoading ? (<div className=\"loading-text\" style={{ display: \"flex\", flexDirection: \"column\", alignItems: \"center\", padding: \"2rem\" }}><div className=\"small-spinner\"></div><p>Loading goals...</p></div>) : savingsGoals.length > 0 ? (')
with open('src/components/InsightsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('Done!')
