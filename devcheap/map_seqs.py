seqs=[
'c3a2e2809ac2acc3',
'c3a2e282acc29d20',
'c3a2e282acc59324',
'c3a2e282acc5a1c3',
'c3a2e282ace2809c',
'c3a2e282ace2809d',
]
for h in seqs:
    b=bytes.fromhex(h)
    s=b.decode('utf-8')
    try:
        b2=s.encode('cp1252', errors='replace')
        s2=b2.decode('utf-8', errors='replace')
    except Exception as e:
        s2=f'error {e}'
    print(h, repr(s2))
