import Image from 'next/image';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import type { NeighborhoodContact } from '@/lib/data/profile';
import { getWhatsAppUrl } from '@/lib/profile';

interface ContactCardProps {
  contact: NeighborhoodContact;
  onUnavailable: () => void;
}

export function ContactCard({ contact, onUnavailable }: ContactCardProps) {
  const href = getWhatsAppUrl(contact.whatsapp);
  const content = <><span>Hubungi Via WhatsApp</span><Image src="/icons/chat.svg" alt="" width={27} height={27} /></>;
  return (
    <li className="space-y-4 rounded-md bg-primary-100 p-4">
      <div className="flex items-center gap-3">
        <Avatar name={contact.name} className="size-12 text-body-2" />
        <div className="min-w-0">
          <h3 className="text-body-1 font-bold leading-tight text-neutral-900 sm:text-h7">{contact.name}</h3>
          <p className="text-body-2 text-neutral-900">{contact.position}</p>
        </div>
      </div>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Hubungi ${contact.name} via WhatsApp (tab baru)`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-body-2 font-bold text-white transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
          {content}
        </a>
      ) : (
        <Button onClick={onUnavailable} aria-label={`Hubungi ${contact.name} via WhatsApp`} className="min-h-11 w-full font-bold">
          {content}
        </Button>
      )}
    </li>
  );
}
