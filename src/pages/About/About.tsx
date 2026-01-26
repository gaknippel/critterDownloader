import './About.css'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const items = [
  {
    value: "item-1",
    trigger: "it's not working!!!",
    content:
      "this app might have a lot of bugs. but first, make sure you have yt-dlp installed.",
  },
  {
    value: "item-2",
    trigger: "what is this app?",
    content:
      "this is a youtube downloader.",
  },
  {
    value: "item-3",
    trigger: "how did i make this?",
    content:
      "this was made using typescript, react, tauri, vite, shadcnui, reactbits, and a rust backend. thanks for yt-dlp for making this possible.",
  },
]



export default function About() {
  return (
    <div className='about-page-wrapper'>
      <div className='accordion-container'>
        <Accordion
          type="single"
          collapsible
          defaultValue="item-1"
          className="max-w-lg"
        >
          {items.map((item) => (
            <AccordionItem key={item.value} value={item.value}>
              <AccordionTrigger>{item.trigger}</AccordionTrigger>
              <AccordionContent>{item.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}