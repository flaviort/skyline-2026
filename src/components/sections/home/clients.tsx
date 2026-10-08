import { Section } from "@/components/layout/section";
import { Marquee } from "@/components/motion/marquee";
import { LogoMark } from "@/components/ui/logo-mark";
import { clients } from "@/content/home";

/**
 * Part 02 until the client logo SVGs arrive: the names in two giant rows
 * running against each other, pushed along (and turned around) by the scroll.
 */
export function Clients() {
  const half = Math.ceil(clients.names.length / 2);
  const rows = [clients.names.slice(0, half), clients.names.slice(half)];
  return (
    <Section theme="light" navTheme="light" data-nova-cover="" aria-label={clients.label} className="overflow-clip pb-[12rem] max-md:pb-[6rem]">
      <ul className="sr-only">
        {clients.names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      {rows.map((row, index) => (
        <Marquee key={index} direction={index ? 1 : -1} duration={40}>
          {row.map((name) => (
            <span key={name} className="heading-xl flex items-center gap-[3rem] pr-[3rem] whitespace-nowrap">
              {name}
              <LogoMark className="h-[0.5em] w-auto text-orange" />
            </span>
          ))}
        </Marquee>
      ))}
    </Section>
  );
}
