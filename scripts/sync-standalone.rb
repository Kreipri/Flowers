# Rebuild the browser JSX from the readable source modules, without a bundler.
root = File.expand_path('..', __dir__)
files = %w[src/gameConfig.js src/utils/soundEngine.js src/components/Artwork.jsx src/components/IntroScreen.jsx src/components/CatchingGame.jsx src/components/GameOverModal.jsx src/App.jsx]
modules = files.map do |file|
  File.read(File.join(root, file)).gsub(/^import .*\n/, '').gsub(/^export default /, '').gsub(/^export /, '')
end
# Configuration comes first, then hooks, then the engine/components that consume it.
modules.insert(1, 'const { useState, useEffect, useRef, useCallback } = React;')
code = modules.join("\n\n")
entry = File.join(root, 'index.html')
html = File.read(entry)
# The static tab title is generated from the same editable text as document.title.
title = modules.first[/appTitle: '([^']+)'/, 1]
html = html.sub(/<title>.*?<\/title>/m) { "<title>#{title}</title>" } if title
script = "<script type=\"text/babel\" data-presets=\"smiley\">\n#{code}\nReactDOM.createRoot(document.getElementById('root')).render(<App />);\n</script>"
raise 'Missing standalone script' unless html.match?(/<script type="text\/babel"[^>]*>.*?<\/script>/m)
File.write(entry, html.sub(/<script type="text\/babel"[^>]*>.*?<\/script>/m) { script })
puts 'Synchronized index.html with source modules.'
