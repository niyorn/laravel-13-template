---
paths:
    - '**/*.php'
---

# General

## Always use named arguments on first-party calls

Every call into our own code uses named arguments, whatever the argument count: `notify(user: $user, force: true)`, `new Money(amount: 100, currency: 'EUR')`. There is no threshold — one argument gets a name too.

Do NOT name arguments on framework, package or PHP internal calls. A package may rename a parameter in a minor release without calling it a break, which turns the call into a runtime `Unknown named parameter` fatal. Same for a call typed against an interface: implementations are free to use different parameter names.

Nothing enforces this — no PHPStan or Rector rule exists for it, and we deliberately did not write one. It is a convention to follow by hand.
