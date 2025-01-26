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
- [x] Bot Usage Tracking
- [x] Switch from Prisma to Drizzle
- [x] Swtich from Node to TSX

## Info

### Log IDs

- 101 - user -> connected voice chat
- 102 - user -> moved voice chat
- 103 - user -> disconnected voice chat
- 104 - user -> started streaming
- 105 - user -> stopped streaming

- 201 - guild -> created
- 202 - guild -> deleted
- 211 - guild -> ignore user
- 212 - guild -> unignore user

- 301 - channel -> tracked
- 302 - channel -> untracked
- 303 - channel -> tracked all
- 304 - channel -> untracked all
