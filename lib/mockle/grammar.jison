%lex

%x directive
%x idirective
%x call

%%

\n" "*"@if"      this.begin('directive'); return 'IF';
\n" "*"@else"    this.begin('directive'); return 'ELSE';
\n" "*"@elsif"   this.begin('directive'); return 'ELSIF';
\n" "*"@endif"   this.begin('directive'); return 'ENDIF';
\n" "*"@for"     this.begin('directive'); return 'FOR';
\n" "*"@endfor"  this.begin('directive'); return 'ENDFOR';

"@@"  return 'ATCHAR';
"@"   this.begin('directive'); return this.lex();

<directive>"if"      return 'IF';
<directive>"else"    return 'ELSE';
<directive>"elseif"  return 'ELSEIF';
<directive>"endif"   return 'ENDIF';
<directive>"for"     return 'FOR';
<directive>"endfor"  return 'ENDFOR';
<directive>"call"    this.begin('call'); return 'CALL';
<directive>\w+       return 'IDENT';
<directive>"."       return 'DOT';
<directive>"("       this.begin('idirective'); return 'LPAREN';
<directive><<EOF>>   return 'EOF';
<directive>(.|\n) %{
    this.popState();
    this.less();
    return this.lex();
  %}

<idirective>" in "    return 'IN';
<idirective>\d+       return 'NUMBER';
<idirective>\w+       return 'IDENT';
<idirective>\s+       /* skip */
<idirective>"."       return 'DOT';
<idirective>","       return 'COMMA';
<idirective>"="       return 'EQ';
<idirective>")"       this.popState(); this.popState(); return 'RPAREN';


<call>"(" return 'LPAREN';
<call>"," this.popState(); this.begin('idirective'); return 'COMMA';
<call>")" this.popState(); this.popState(); return 'RPAREN';
<call>[\w\.\/]+ return 'CNAME';

([^@]+)(?=\n\s*@) return 'TEXT';
[^@]+             return 'TEXT';
<<EOF>>           return 'EOF';

/lex


%start main

%%

main
    : contents EOF
      { return $1 }
    ;

contents
    : content  -> {type: 'contents', children: [$1]}
    | contents content -> ($1.children.push($2), $1)
    ;

content
    : TEXT    -> {type: 'html', value: $1}
    | ATCHAR  -> {type: 'html', value: '@'}
    | expr    -> {type: 'text', value: $1}
    | if   -> $1
    | for  -> $1
    | call -> $1
    ;

expr
    : IDENT          -> {type: 'lookup', loc: @$, name: $1}
    | expr DOT IDENT -> {type: 'lookup', loc: @3, name: $3, base: $1}
    | NUMBER         -> {type: 'number', value: $1}
    ;

if
    : IF LPAREN expr RPAREN contents if_end
        { $$ = {type: 'if', cond: $3, tbranch: $5, fbranch: $6} }
    ;

else
    : ELSE contents  -> $2
    | ELSE LPAREN RPAREN contents  -> $4
    ;

if_end
    : ENDIF  -> null
    | else ENDIF  -> $1
    | ELSEIF LPAREN expr RPAREN contents if_end
        { $$ = {type: 'if', cond: $3, tbranch: $5, fbranch: $6} }
    ;

for
    : FOR LPAREN IDENT IN expr RPAREN contents for_end
        { $$ = {type: 'for', name: $3, expr: $5, body: $7, ebranch: $8} }
    ;

for_end
    : ENDFOR  -> null
    | else ENDFOR  -> $2
    ;

call
    : CALL LPAREN CNAME arglist RPAREN
        { $$ = {type: 'call', loc: @$, name: $3, args: $4} }
    | CALL LPAREN CNAME RPAREN
        { $$ = {type: 'call', loc: @$, name: $3, args: []} }
    ;

arg
    : COMMA expr -> ['argsplat', $2]
    | COMMA IDENT EQ expr -> ['arg', $2, $4]
    ;

arglist
    : arg         -> [$1]
    | arglist arg -> ($1.push($2), $1)
    ;

