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
    try:
        s=b.decode('utf-8')
    except:
        s='decode error'
    print(h, repr(s))
