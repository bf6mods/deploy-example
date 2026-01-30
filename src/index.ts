import { Clients, Generated_pb } from "@bf6mods/portal";
import {
    cancel,
    intro,
    isCancel,
    log,
    outro,
    select,
    text,
} from "@clack/prompts";

export const clients = new Clients();
intro(`name-updater`);

log.warn(
    "This is a proof of concept, it can potentially corrupt an existing portal mod, use at your own risk and backup your experiences if needed.",
);

log.info(
    "You can get the token by going to portal.battlefield.com and opening inspect element and searching for any request like getPlayElement or getOwnedPlayElements then copying it from the request header `X-Gateway-Session-Id`.",
);

let sessionId = await text({
    message: "Auth code",
    placeholder: "web-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    validate(value) {
        if (value?.length === 0) return `Value is required!`;
    },
});

if (isCancel(sessionId)) {
    cancel("Operation cancelled.");
    process.exit(0);
}

await clients.authenticate({
    sessionId,
});

const elements = await clients.play.getOwnedPlayElementsV2({
    publishStates: [
        Generated_pb.PublishStateType.Draft,
        Generated_pb.PublishStateType.Published,
        Generated_pb.PublishStateType.Error,
    ],
    includeDenied: true,
});

const selectedElement = await select({
    message: "Select an element to change the name of",
    options: elements.playElements.map((element) => ({
        value: element,
        label: `${element.playElement?.name}: ${element.playElement?.description}`,
    })),
});

if (isCancel(selectedElement) || !selectedElement) {
    cancel("Operation cancelled.");
    process.exit(0);
}

const newName = await text({
    message: "New name",
    placeholder: selectedElement.playElement?.name,
    validate(value) {
        if (value?.length === 0) return `Value is required!`;
    },
});

if (isCancel(newName)) {
    cancel("Operation cancelled.");
    process.exit(0);
}

const playElement = await clients.play.getPlayElement({
    id: selectedElement.playElement?.id,
    includeDenied: true,
});

await clients.play.updatePlayElement({
    id: playElement.playElement?.id,
    name: newName,
    description: playElement.playElement?.description,
    designMetadata: playElement.playElementDesign?.designMetadata,
    mapRotation: selectedElement.mapRotation,
    mutators: playElement.playElementDesign?.mutators,
    assetCategories: playElement.playElementDesign?.assetCategories,
    originalModRules:
        playElement.playElementDesign?.modRules?.compatibleRules?.original,
    playElementSettings: playElement.playElement?.playElementSettings,
    publishState: playElement.playElement?.publishStateType,
    modLevelDataId: playElement.playElementDesign?.modLevelDataId,
    thumbnailUrl: playElement.playElement?.thumbnailUrl,
    attachments: playElement.playElementDesign?.attachments,
});

outro(`Name changed!`);
