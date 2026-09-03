import { createHash } from "node:crypto";

type NamedCommand = {
  name: string;
};

export function createCommandHash(commands: readonly NamedCommand[]): string {
  const commandsByName = [...commands].sort((first, second) => {
    if (first.name < second.name) return -1;
    if (first.name > second.name) return 1;
    return 0;
  });

  return createHash("sha256").update(JSON.stringify(commandsByName)).digest("hex");
}
