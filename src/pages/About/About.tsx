import './About.css'

import SplitText from '../../components/SplitText'


import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const items = [
  {
    value: "item-1",
    trigger: "it's not working!",
    content:
      "this app might have a lot of bugs, i mainly use it for myself, so if it works for me thats fine (sorry)",
  },
  {
    value: "item-2",
    trigger: "what is this app?",
    content:
      "this is a youtube downloader! sick of all those sketchy websites or paid subscriptions for a basic feature? use this!",
  },
  {
    value: "item-3",
    trigger: "how did i make this?",
    content:
      "this app was made with tauri, typescript + react, shadcnui, reactbits, and yt-dlp.",
  },
]

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};



export default function About() {
  return (
    <div className='about-page-wrapper'>

        <SplitText
          text="about this app"
          className="about-welcome-message"
          delay={15}
          duration={0.6}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
          onLetterAnimationComplete={handleAnimationComplete}
        />
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