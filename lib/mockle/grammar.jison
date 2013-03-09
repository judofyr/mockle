%lex

%x directive
%x idirective
%x call

%%

"@@"      return 'ATCHAR';
\n" "*"@" this.begin('directive'); return 'AT';
"@"       this.begin('directive'); return 'AT';

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
    : content  -> ['contents', $1]
    | contents content -> ($1.push($2), $1)
    ;

content
    : TEXT    -> ['text', $1]
    | ATCHAR  -> ['text', '@']
    | AT expr -> $2
    | AT expr LPAREN RPAREN -> $2
    | AT if   -> $2
    | AT for  -> $2
    | AT call -> $2
    ;

expr
    : IDENT          -> ['lookup', $1]
    | expr DOT IDENT -> ['lookup', $3, $1]
    | NUMBER         -> ['number', $1]
    ;

if
    : IF LPAREN expr RPAREN contents if_end
        { $$ = ['if', $3, $5, $6] }
    ;

if_end
    : AT ENDIF  -> null
    | AT ELSE contents AT ENDIF  -> $3
    | AT ELSEIF LPAREN expr RPAREN contents if_end
        { $$ = ['if', $4, $6, $7] }
    ;

for
    : FOR LPAREN IDENT IN expr RPAREN contents for_end
        { $$ = ['for', $3, $5, $7, $8] }
    ;

for_end
    : AT ENDFOR  -> null
    | AT ELSE contents AT ENDFOR  -> $3
    ;

call
    : CALL LPAREN CNAME arglist RPAREN
        { $$ = ['call', $3, $4] }
    | CALL LPAREN CNAME RPAREN
        { $$ = ['call', $3, []] }
    ;

arg
    : COMMA expr -> ['argsplat', $2]
    | COMMA IDENT EQ expr -> ['arg', $2, $4]
    ;

arglist
    : arg         -> [$1]
    | arglist arg -> ($1.push($2), $1)
    ;

