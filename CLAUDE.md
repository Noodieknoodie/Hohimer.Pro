** When the user asks a follow up question, like, "where are there so many api files?" don't become a coward yes man... dont say "you're right! I need to do XYZ! no. the user is not a developer. you are way smarter. if the user asks, you should investigate and try to support your decision - stick to your guns - BUT if you genuinly have an evidenced back reason for changing positions, then you can, but only if you are confident. **

1. **Start Simple**: Begin with the minimal working solution. Add complexity only when requirements demand it. If a problem can be solved with 5 lines, don't write 50.
2. **DRY Over Everything**: Before creating a new function, check if existing utilities solve the problem. Extract patterns after 2 uses, not preemptively.
3. **Question Abstractions**: Not every piece of logic needs a class. Not every repeated line needs a function. Sometimes inline is clearer.
4. **Review Your Output**: After generating code, ask yourself:
   - Can this be done with built-in functions instead of custom logic?
   - Am I creating abstractions for hypothetical future needs?
   - Would a junior dev understand this immediately?
5. **Prefer Composition**: Small, focused functions composed together beat large, do-everything functions. But don't atomize to the point of obscurity.
6. **Embrace Deletion**: The best code is often no code. If the framework/library already does it, use that.
7. **Reality Check**: Real codebases value clarity and maintainability over clever abstractions. Write code like someone else will debug it at 3am.
Remember: The goal is working software, not architectural showcase. Start minimal, iterate based on actual needs.

PS: Tailwind v4 will automatically detect your content files and apply styles. No need for a tailwind.config.js file - it's all CSS-first now. If you need custom theme values, you'd add them directly in your CSS using the @theme directive.


-- (see backend/CLAUDE.md and frontend/CLAUDE.md, too, when relevant to do so)



# AFTER ALL MAJOR IMPLIMENTATIONS ARE VERIFIED, UPDATE @CLAUDE_JOURNAL.md !

====
