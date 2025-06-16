import React from 'react'
import Fileupload from '@/app/components/fileupload'
import ChatComponent from './components/chat'

export default function Home() {
  return (
    <div>
      <div className='flex min-h-screen w-screen items-center justify-center'>
        <div className='w-[30vw] min-h-screen flex justify-center items-center '><Fileupload/> </div>
        <div className='w-[70vw] min-h-screen flex justify-center items-center border-l-2'><ChatComponent/></div>
      </div>


    </div>
  )
}
