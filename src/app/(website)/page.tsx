import Image from "next/image";

export default function Home() {
  return (
    <div>
      <main>

        <Image
          src="/images/site/banner.png"
          alt="Site banner featuring most of my games"
          style={{ width: '100%', height: 'auto', display: 'block', margin: 'auto' }}
          width={2000}
          height={500}
          priority
        />
        <h2 className ="text-[70%] lg:text-[0.7rem] xl:text-[0.7vw] text-center italic">(Website still in development)</h2>
        <h1 className ="text-[500%] lg:text-[5rem] xl:text-[6vw] text-center mt-50 mb-10">Hello!</h1>
        <p className ="text-[100%] lg:text-[1rem] xl:text-[1vw] text-center">I'm Serenity, also known as SerenityDev. <br/><br/> I'm an Indie Game Developer creating "Wretched Rose" and learning music composition to make my first song "Flawed by Design"! <br/><br/> I'm also a streamer! More info on that in the toybox!</p>
      </main>
    </div>
  );
}
