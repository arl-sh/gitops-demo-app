# Demo application

This repository contains a very basic [Express](https://expressjs.com) web server in JavaScript with [Node.js](https://nodejs.org).\
It has two endpoints:
```
GET /

Content-Type: text/html

Hello, World!
```
and
```
GET /api

Content-Type: application/json

{"hello": "world"}
```

It attempts to bind to port `8080` on all available interfaces.\
It is meant to be run inside a container.

It thus contains a Dockerfile. To build an image, use:
```
docker build -t gitops-demo-app .
```

You can then start a containerized instance of this application with:
```
docker run -p 8080:8080 gitops-demo-app
```

Or directly, without having to build the image yourself, by using:
```
docker run -p 8080:8080 ghcr.io/au2001/gitops-demo-app
```
It uses the pre-built Docker image available from the GitHub Container Registry here: [ghcr.io/au2001/gitops-demo-app](https://github.com/au2001/gitops-demo-app/pkgs/container/gitops-demo-app).

---

# GitOps

The main use-case of this demo application is to show a best-practice in the adoption of [GitOps](https://www.gitops.tech).\
It shows how GitHub Actions can be leveraged to achieve Continuous Integration (CI) in a way which is compatible with a GitOps model of Continuous Deployment (CD).

## Continuous Integration

> Continuous integration (CI) systems provide automation of the software build and validation process driven in a continuous way by running a configured sequence of operations every time a software change is checked into the source code management repository. These are closely associated with agile development practices and closely related to the emerging DevOps toolsets.

\- From the [Gartner Glossary](https://www.gartner.com/en/information-technology/glossary/continuous-integration-ci)

In this repository, the CI pipelines are stripped down to the minimum: building and releasing.\
This is simply in order to focus on the main interest of this repository. Unit/integration/end-to-end tests can easily be added.

The CI pipeline's logic can be found in the [`build` GitHub Actions workflow](https://github.com/au2001/gitops-demo-app/blob/main/.github/workflows/build.yml#L133-L160).

In order to optimize re-deployments, commits for which a build is already stored on the target registry are [retagged instead of rebuilt](https://github.com/au2001/gitops-demo-app/blob/main/.github/workflows/build.yml#L106-L131).

## Multi-environment CD

### Context

Continuous Integration has existed for quite some time now, and it has well-defined best-practices depending on the tools used.\
The issue arrises when trying to support multiple environments at once while following the GitOps methodology.\
This repository was created to attempt to address this problem in most efficient and elegant way as possible.

The proposed solution is in no way the perfect and universal solution.\
It does try to define a best-practice by staying application-agnostic, though. Even then, it is opinionated.\
Contributions are welcome, as well for issues you encounter with this solution, as for feedback of your own implementation.

Here is the dilemma faced when implementing CI while supporting multiple environments with GitOps:
- Code is intrinsically linked to deployment environments: a commit can be seen as a snapshot of an environment at a specific time.
- These snapshots can then navigate between environments, by being promoted, rolled back, etc.
- Code duplication is highly unproductive and inefficient, and should be avoided at all costs.
- So, to extend GitOps, standard Git operations should be leveraged to perform CI- and environment-related operations.
- Developers should also be able to deploy non-breaking changes automatically to a development environment if it exists.
- Developers should be able to target which environment their commits should get deployed to (e.g. several UAT environments in parallel).
- Fine-grained access control must be possible, allowing to decide who can deploy to which environment through existing IAMs.
- Breaking existing developers' workflows will unconditionally slow down or even prevent wide-spread adoption of newer and more optimal workflows (e.g. GitOps).

### Solution

The following concepts are used in the proposed best-practice solution:
- The Reference concept in Git is used to describe environments. More specifically:\
An environment is defined by zero or more branches, and optionally through a subset of tags (e.g. filtered by a regular expression).
  - The recommendation for production environements is to use [semantic versioned](https://semver.org) tags only.
  - The recommendation for additionnal production channels is to use SemVer tags only with an identifiable label (e.g. `1.1.0-alpha1`, `1.0.3-beta2` for `alpha` and `beta` channels respectively).
  - The recommendation for staging/pre-production environments is to use the main branch only.
  - The recommendation for testing environments (e.g. UAT, SIT) is to use exactly one branch per testing environment, named in a standard pattern after the corresponding environment.
  - The recommendation for development environments is to use all branches, excluding the main branch and all testing branches.
- Each update in a branch or tag tracked by an environment should automatically trigger a single CI pipeline common to all environments, with environment-specific parameters if needed.
- All artifacts generated by the CI pipeline should allow to identify its originating commit AND its target environment(s) as well as be sortable (e.g. `dev-b4b9fda-1654880868` where `b4b9fda` is the commit's SHA and `1654880868` is the build timestamp).
- Environment promotion is achieved through either merging branches or tagging a commit.
- Permanent environment rollbacks are achieved through reverting a commit and updating the corresponding reference (i.e. pushing to the branch, or pushing a higher versioned tag).
- *Side note:* temporary rollbacks should be handled at the CD-level. They are not in the scope of this methodology.
- Access control should be defined by restricting write-access to specific branches or to tags.
- Approval workflows should be implemented as Pull Requests (aka Merge Requests) from an environment's branch to another's.

## GitHub Actions implementation

The described solution has been implemented in this repository with the demo application.\
Four environements are defined: Production, Staging, Testing, and Development.

Each environment has its own GitHub Actions workflow, with the triggers associated to the environment and the differenciating parameters for that environment's artifacts (Docker images):
- [Development](https://github.com/au2001/gitops-demo-app/blob/main/.github/workflows/development.yml) has prefix `dev-`, is identified by the source branch + the commit SHA, and is ordered by timestamp.
- [Testing](https://github.com/au2001/gitops-demo-app/blob/main/.github/workflows/testing.yml) has prefix `tst-`, is identified by the commit SHA, and is ordered by timestamp.
- [Staging](https://github.com/au2001/gitops-demo-app/blob/main/.github/workflows/staging.yml) has prefix `stg-`, is identified by the commit SHA, and is ordered by timestamp.
- [Production](https://github.com/au2001/gitops-demo-app/blob/main/.github/workflows/production.yml) has prefix `prd-` and is identified and ordered by the SemVer extracted from the tag name.

They all include a [reusable GitHub Actions workflow](https://github.com/au2001/gitops-demo-app/blob/main/.github/workflows/build.yml) responsible for defining the CI pipeline itself.

## Full-fledged example

This repository only contains a demo application and CI pipelines. It is only a small part in the whole setup.\
The missing parts correspond to the GitOps methodology for CD, which is *(arguably)* the most interesting.

The corresponding repository of a best-practice approach of GitOps-like CD with Flux is [au2001/gitops-demo](https://github.com/au2001/gitops-demo).\
Please see the README.md over in that repository for more information.

---

# Notes

The content of this repository does not match one-to-one the description made in this document.\
This is only because the code has not been finalized with the latest best-practices.\
**The current document thus prevails over any code found in this repository.**

Feel free to open a Pull Request to help making the implementation as close as possible to the best-practice definition described above.
