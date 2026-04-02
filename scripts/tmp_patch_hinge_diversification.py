#!/usr/bin/env python3
"""
Structural hinge diversification for relationship and realization families.

Problem:
  - Layer B: 4 c_relationship_angle winners all produce "center your essay on the" (5-word prefix)
  - Layer B: 4 c_realization_angle winners (default branch) all produce "show how your understanding shifted"
  - Both exceed literal_prefix_max=3

Fix:
  - Introduce 3 structurally distinct hinge shapes for each family, selected by seedValue % 3
  - idx=0: current canonical shape (moment-first / comprehension-first)
  - idx=1: response-shift / approach-shift shape
  - idx=2: read-shift / judgment-shift shape
  - Each shape produces a different 5-word opening after the starter
"""

import re

TARGET = "src/lib/fm/direction.ts"

with open(TARGET, "r") as f:
    src = f.read()

# ---- CHANGE 1: Relationship hinge diversification ----
# Old: single-shape relationship hinge
OLD_REL = """        case 'relationship':
          return actor
            ? `the moment you changed how you responded to ${actor.toLowerCase()}`
            : (turningQ
              ? `the moment you changed your response after ${turningQ}`
              : 'the moment you changed your response based on what someone else needed');"""

NEW_REL = """        case 'relationship': {
          // Structural hinge diversification: 3 distinct sentence shapes prevent
          // literal 5-word prefix collapse across multiple relationship winners in a batch.
          // idx=0: moment-first (canonical); idx=1: response-shift; idx=2: read-shift
          const rIdx = seedValue % 3;
          if (rIdx === 1) {
            return actor
              ? `how your response to ${actor.toLowerCase()} changed when what they actually needed became clear`
              : (turningQ
                ? `how your response changed when ${turningQ} made it clear what was actually needed`
                : 'how recognizing what someone else actually needed changed your response standard');
          } else if (rIdx === 2) {
            return actor
              ? `what changed in how you read what ${actor.toLowerCase()} needed from you`
              : (turningQ
                ? `what shifted in your read after ${turningQ} forced a different response`
                : 'what forced you to change how you read what someone else actually needed');
          }
          // rIdx === 0: canonical moment-first shape
          return actor
            ? `the moment you changed how you responded to ${actor.toLowerCase()}`
            : (turningQ
              ? `the moment you changed your response after ${turningQ}`
              : 'the moment you changed your response based on what someone else needed');
        }"""

if OLD_REL in src:
    src = src.replace(OLD_REL, NEW_REL, 1)
    print("✓ Applied relationship hinge diversification")
else:
    print("✗ FAILED: relationship hinge old string not found")
    # Show context around 'relationship':
    idx = src.find("case 'relationship':")
    if idx != -1:
        print(f"  Found 'case relationship' at char {idx}:")
        print(repr(src[idx:idx+300]))

# ---- CHANGE 2: Realization default hinge diversification ----
# Old: single-shape default hinge in realization switch
OLD_REAL_DEFAULT = """            default:
              return reflectionQ
                ? `your understanding shifted at ${reflectionQ}`
                : 'your understanding changed your next decision';
          }"""

NEW_REAL_DEFAULT = """            default: {
              // Structural hinge diversification: 3 distinct shapes prevent
              // literal 5-word prefix collapse across multiple realization winners in a batch.
              // idx=0: comprehension (canonical); idx=1: approach-shift; idx=2: judgment-shift
              const rlIdx = seedValue % 3;
              if (rlIdx === 1) {
                return reflectionQ
                  ? `your approach to the decision shifted at ${reflectionQ}`
                  : 'your approach to the situation changed what you chose to do';
              } else if (rlIdx === 2) {
                return reflectionQ
                  ? `the shift in your judgment came at ${reflectionQ}`
                  : 'the shift in your read of the situation changed your next decision';
              }
              // rlIdx === 0: canonical comprehension shape
              return reflectionQ
                ? `your understanding shifted at ${reflectionQ}`
                : 'your understanding changed your next decision';
            }
          }"""

if OLD_REAL_DEFAULT in src:
    src = src.replace(OLD_REAL_DEFAULT, NEW_REAL_DEFAULT, 1)
    print("✓ Applied realization default hinge diversification")
else:
    print("✗ FAILED: realization default old string not found")
    # Show context
    idx = src.find("default:\n              return reflectionQ")
    if idx != -1:
        print(f"  Found default at char {idx}:")
        print(repr(src[idx:idx+200]))

with open(TARGET, "w") as f:
    f.write(src)
print(f"\nWrote {TARGET}")
