# Collaborative Clarity

Artifact rounds for DeepSeek Harness. The agent opens a decision in the right sidebar,
shows the smallest HTML artifact that makes it concrete, and waits inside a tool call while
the user annotates the artifact and chooses. The decision returns as structured data.

This is a prototype. The verified scope and the remaining gaps are recorded in
[docs/collaboration-draft/06-implementation.md](docs/collaboration-draft/06-implementation.md).

## What is here

| Path | What it is |
|---|---|
| [plugin/](plugin/) | The DSH plugin: `clarity_round`, `clarity_test`, the Clarity tab, and the annotation bridge |
| [docs/collaboration-draft/](docs/collaboration-draft/) | The diagnosis, protocol, surface design, verification rules, and the real round records |
| [LICENSE](LICENSE) | Apache License 2.0 |

The publishable package is `plugin/`, published as `@ds-hu/dsh-collaborative-clarity`.
The repository root is not the package.

## Install from this checkout

Use the plugin manager; do not hand-edit the profile.

```text
plugin_manager install_bundle  target: link:D:/Projects/dsh-collaborative-clarity/plugin
plugin_manager remove_bundle   target: "@ds-hu/dsh-collaborative-clarity"
```

The client half hot-reloads. Host changes need a restart of the DSH web process.

## Read the design

Start with [docs/collaboration-draft/README.md](docs/collaboration-draft/README.md). The
short version: the unit of collaboration is a round, not a sentence; a round has one
decision, an artifact, a recommendation, and a stated foreclosure; a human-run real test is
the only thing that marks a feature tested.

## License

Apache License 2.0. See [LICENSE](LICENSE).
