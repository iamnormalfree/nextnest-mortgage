# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - navigation [ref=e3]:
    - generic [ref=e4]:
      - link "NextNest Logo" [ref=e5] [cursor=pointer]:
        - /url: /
        - img "NextNest Logo" [ref=e6]
      - generic [ref=e7]:
        - link "Back to Home" [ref=e8] [cursor=pointer]:
          - /url: /
        - button "Get Started →" [ref=e9] [cursor=pointer]
  - main [ref=e10]:
    - generic [ref=e13]:
      - generic [ref=e15]: MC
      - generic [ref=e16]:
        - paragraph [ref=e17]: AI BROKER MATCHED
        - heading "Michelle Chen" [level=3] [ref=e18]
        - paragraph [ref=e19]: Perfect match found!
      - button "Connecting..." [disabled]:
        - img
        - text: Connecting...
```