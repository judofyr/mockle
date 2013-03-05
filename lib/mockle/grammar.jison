%lex

%x directive

%%

\n" "*"@" this.begin('directive'); return 'AT';
"@"       this.begin('directive'); return 'AT';

<directive>"if"      return 'IF';
<directive>"else"    return 'ELSE';
<directive>"elseif"  return 'ELSEIF';
<directive>"endif"   return 'ENDIF';
<directive>"for"     return 'FOR';
<directive>"endfor"  return 'ENDFOR';
<directive>\w+       return 'IDENT';
<directive>"."       return 'DOT';
<directive>"("       return 'LPAREN';
<directive>")"       this.popState(); return 'RPAREN';
<directive><<EOF>>   return 'EOF';
<directive>(.|\n) %{
    this.popState();
    this.less();
    return this.lex();
  %}

(.|\n)         return 'CHAR';
<<EOF>>        return 'EOF';

/lex


%start main

%%

main
    : contents EOF
        { console.log(JSON.stringify($1)) }
    ;

contents
    : content
        { $$ = $1; }
    | contents content
        { $$ = ['merge', $1, $2]; }
    ;

content
    : CHAR
        { $$ = ['char', $1]; }
    | AT expr -> $2
    | AT if   -> $2
    | AT for  -> $2
    ;

expr
    : WORD
        { $$ = ['word', $1] }
    | expr DOT IDENT
        { $$ = ['access', $1, $3] }
    ;

if
    : IF LPAREN expr RPAREN contents AT ENDIF
        { $$ = ['if', $3, $5] }
    ;

