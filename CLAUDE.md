
# FRONTEND RULE
- ui.shadcn.com 적극 활용
- magic ui 활용
- 주기적으로 리팩토링 해
- 코드가 1000줄이 넘어가면 리팩토링 해

# SUPABASE DB SCHEMA MANAGEMENT

## DB RULES

- `supabase/schemas` : souce of truth

## DB Change Protocol

1. Change `supabase/schemas`
2. Generate migration file : `supabase db diff -f mgiration_name`
3. [OPTINAL] Migrate to local : `supabase migration up`
4. [CONFIRM NEEDED] Migrate to production : `supabase db push`

## Additional Tips
1. Use uuid for id(pk)
2. If `supabase link` fails, try `supabase unlink` / `supabase stop`