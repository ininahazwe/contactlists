import { useDetail } from "../hooks/useDetail";
import ContactModal from "./ContactModal";
import EventModal from "./EventModal";
import OrganizationModal from "./OrganizationModal";

/**
 * Displays the detail view named by the URL. The three views link to
 * each other (a contact → one of their events → a participant...),
 * each hop remaining a history entry.
 */
export default function DetailRouter() {
  const { target, close, openContact, openOrganization, openEvent } = useDetail();

  if (!target) return null;

  if (target.kind === "contact") {
    return (
      <ContactModal
        contactId={target.id}
        onClose={close}
        onOpenEvent={openEvent}
        onOpenOrganization={openOrganization}
      />
    );
  }

  if (target.kind === "organization") {
    return (
      <OrganizationModal
        organizationId={target.id}
        onClose={close}
        onOpenContact={openContact}
        onOpenEvent={openEvent}
      />
    );
  }

  return (
    <EventModal
      eventId={target.id}
      onClose={close}
      onOpenContact={openContact}
      onOpenOrganization={openOrganization}
    />
  );
}
