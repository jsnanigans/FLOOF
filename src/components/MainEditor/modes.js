let all = ['gfm', 'puppet', 'ttcn-cfg', 'go', 'jsx', 'perl', 'asciiarmor', 'turtle', 'ntriples', 'smalltalk', 'forth', 'xml', 'django', 'r', 'gherkin', 'http', 'fcl', 'mathematica', 'yacas', 'diff', 'haxe', 'php', 'crystal', 'vue', 'z80', 'dylan', 'properties', 'rst', 'twig', 'scheme', 'tiddlywiki', 'rust', 'javascript', 'pig', 'smarty', 'jinja2', 'asterisk', 'groovy', 'vb', 'haml', 'htmlembedded', 'julia', 'pascal', 'yaml', 'clojure', 'ruby', 'yaml-frontmatter', 'tiki', 'd', 'oz', 'erlang', 'python', 'stex', 'dtd', 'mbox', 'cobol', 'protobuf', 'fortran', 'slim', 'octave', 'mscgen', 'lua', 'ecl', 'markdown', 'solr', 'coffeescript', 'swift', 'textile', 'troff', 'sass', 'asn.1', 'factor', 'powershell', 'verilog', 'idl', 'eiffel', 'rpm', 'tornado', 'spreadsheet', 'haskell', 'ebnf', 'sas', 'mllike', 'handlebars', 'sql', 'stylus', 'mumps', 'mirc', 'webidl', 'nsis', 'cypher', 'sparql', 'clike', 'htmlmixed', 'elm', 'soy', 'toml', 'sieve', 'tcl', 'velocity', 'gas', 'vhdl', 'apl', 'css', 'modelica', 'commonlisp', 'pegjs', 'vbscript', 'cmake', 'livescript', 'dart', 'dockerfile', 'haskell-literate', 'brainfuck', 'nginx', 'ttcn', 'shell', 'q', 'pug', 'xquery']

let rt = {}

all.forEach(name => {
  rt[name] = require('codemirror/mode/' + name + '/' + name + '.js')
})

export default rt
