# Parall-Align

**Parall-Align** is a webapp for remote teams that need business and technical stakeholders to understand the same system the same way.
It gives a team a small set of shared, deliberately incomplete visual canvases, so that planning and prioritization decisions are made from a common ground.


## Nameing

**Parall-Align** is a portmanteau of *parallax* and *align* — chosen to name the exact mechanic at the core of the product:

- **Parallax** — in optics and astronomy, parallax is the apparent shift of an object depending on the position from which you view it: the same star looks like it's in a different spot when observed from opposite sides of the earth's orbit. That's exactly what happens to a software system when different roles look at it: the same backlog item looks different depending on whether you view it as a *process*, an *object/data structure*, an *integration point*, or a *user interaction*. No single view is "the truth" — each is a partial, honest projection of the same underlying system, and the gaps between them are exactly where risk and misunderstanding hide.
- **Parallel view** — a remote, screen-based tool can put these projections genuinely side by side instead of forcing people to look at one thing at a time. Parall-Align leans into that: multiple canvases open and cross-referenced in parallel, so a team can flip between projections of the same item without losing context.
- **Align** — the whole point of comparing parallax views is to triangulate a shared, agreed position. Parall-Align names that convergence directly: the product's job isn't just to *show* different perspectives, it's to help a distributed team *align* on what they add up to.

Put together: **Parall-Align takes parallel, differently-angled views of the same system and helps a team align on what they want to achive.**


## The Core: Canvases

A Parall-Align project is built around a small number of **canvases**, each dedicated to one deliberately narrow perspective on the system. Every canvas stays intentionally incomplete: it is not a formal specification, but an orientation device — just enough structure to anchor a conversation and reveal what a single stakeholder group would otherwise miss. Canvases live in the same project and can be viewed side by side (the "parallel view"), with elements cross-linked so a change or comment on one canvas can point directly at the related element on another.

- **Backlog Canvas**
  The entry point of the project. Holds prioritized requirements ("items") as short, concrete cards — a title on the front, detail on the back, grouped by theme. As items get analyzed on the other canvases and decisions get made, the backlog tracks their state (open → mapped → decided), so it doubles as the single interface between "people doing the analysis" and "people making the call." A linked **notes area** catches useful context that comes up in discussion but doesn't belong on any single canvas yet — so digressions don't get lost, but don't derail the canvas they interrupted either.

- **Process Canvas**
  Shows the *sequence of business activities* needed to fulfill a backlog item: the steps, the alternative and concurrent paths through them, and the conditions/constraints that route between them. This is the "what has to happen, in what order" view. It stays at a business-activity level of abstraction — implementation steps and technical sequencing belong elsewhere.

- **Object Canvas**
  Shows the *data the process operates on*: the business entities involved (e.g. "customer," "contract," "claim") and the relationships between them, kept at a business level of abstraction. Implementation detail — how entities are actually composed, stored, or indexed — is deliberately left off; the point is to agree on *what things exist and how they relate*, not to pre-decide a schema.

- **Integration Canvas**
  Shows how the system under discussion *talks to everything outside it*: other systems and services, and the data or protocols exchanged at each incoming/outgoing interface. This is where dependency risk and coordination requirements with other teams or external parties become visible early, instead of surfacing mid-implementation.

- **Interaction Canvas**
  Shows how a *person* experiences the system: a navigation overview of menu structure and dialog flow, plus rough storyboard-level sketches of the actual screens where useful. This is the canvas that keeps the other three grounded in what an end user actually does and sees.

Together, these five canvases cover the same five questions any nontrivial backlog item raises — *what has to happen, what data is involved, what it depends on outside itself, how a person uses it, and where does it sit against everything else we've committed to* — without requiring anyone to produce, or read, a complete formal specification to answer them.


