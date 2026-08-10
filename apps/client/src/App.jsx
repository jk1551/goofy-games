import { ConnectionBadge } from "./components/ConnectionBadge.jsx";
import { usePartySocket } from "./hooks/usePartySocket.js";
import { HostGameView } from "./views/HostGameView.jsx";
import { HostLibraryView } from "./views/HostLibraryView.jsx";
import { LandingView } from "./views/LandingView.jsx";
import { PlayerView } from "./views/PlayerView.jsx";

export default function App() {
  const partySocket = usePartySocket();
  const { role, party, game } = partySocket;

  let content;
  if (!role || !party) {
    content = (
      <LandingView
        onCreate={partySocket.createParty}
        onJoin={partySocket.joinParty}
        error={partySocket.error}
      />
    );
  } else if (role === "host" && party.status === "game") {
    content = (
      <HostGameView
        party={party}
        game={game ?? party.game}
        onReturnToLibrary={partySocket.returnToLibrary}
      />
    );
  } else if (role === "host") {
    content = (
      <HostLibraryView
        party={party}
        onSelectGame={partySocket.selectGame}
        onStartGame={partySocket.startGame}
        error={partySocket.error}
      />
    );
  } else {
    content = (
      <PlayerView
        party={party}
        game={game}
        onSubmit={partySocket.submitAction}
        error={partySocket.error}
      />
    );
  }

  return (
    <>
      {content}
      <ConnectionBadge state={partySocket.connectionState} />
    </>
  );
}
