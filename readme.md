# Dandere Bot

## Commands

```ts
/trackvoice-all {channel : textchannel.required}
```

Starts tracking all the voice channels for connections and disconections and logs them in {channel}

---

```ts
/trackvoice-disable
```

Stops tracking voice channels and logging them.

---

```ts
/trackvoice-ignoreuser {user : user.required}
```

Ignore {user} for all channels voice tracking.

---

```ts
/trackvoice-unignoreuser {user : user.required}
```

Unignore {user} for all channels voice tracking.

---

```ts
/nofity {role : role.required} {text: string.required} {log : bool}
```

Notify users of selected {role} via DM sending them {text}. If {log} is true, message is not ephemeral.

---

```ts
/clear {amount : number.required}
```

Clear the channel for an {amount} of messages. Min 1, Max 100.

### Permissions needed

Might not all be necessary, but working on it.

- Manage Channels
- Read Messages / View Channels
- Send Messages
- Manage Messages
- Read Messages History
- Use Slash Commands

## To-Do list

- Commands
  - [ ] Bug reporting
  - [ ] Command sugestion
- Bot Usage Tracking
- [x] Switch from Prisma to Drizzle
- [x] Swtich from Node to TSX
