import { type Client } from "discord.js";

declare global {
  interface ClientType extends Client {
    commands: Collection<string, any>;
  }
}

export {};
