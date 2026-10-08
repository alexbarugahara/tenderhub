"use client";


interface OrganizationStatCardProps {

  icon:React.ReactNode;

  title:string;

  value:string|number;

  subtitle:string;

}



export default function OrganizationStatCard({

icon,

title,

value,

subtitle,

}:OrganizationStatCardProps){



return (

<div

className="
rounded-2xl
border
border-[#D4AF37]/20
bg-white
p-6
shadow-lg
transition
hover:-translate-y-1
"

>


<div className="text-[#D4AF37]">

{icon}

</div>




<p

className="
mt-4
text-sm
font-bold
text-[#071A33]
"

>

{title}

</p>




<h2

className="
mt-3
text-4xl
font-black
text-[#071A33]
"

>

{value}

</h2>




<p

className="
mt-2
text-sm
font-semibold
text-slate-600
"

>

{subtitle}

</p>



</div>


);

}