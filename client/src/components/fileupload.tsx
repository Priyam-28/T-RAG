'use client'
import * as React from 'react'
import {FileUp} from 'lucide-react'


const Fileupload :React.FC =() => {
  const handleFileUploadButtonClick = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.pdf'
    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        const file = target.files[0]
        console.log('Selected file:', file) 
      }
    }
    fileInput.click()
  }
  return (
     <div className="bg-slate-900 text-white shadow-2xl flex justify-center items-center p-4 rounded-lg border-white border-2">
      <div
        onClick={handleFileUploadButtonClick}
        className="flex justify-center items-center flex-col"
      >
        <h3>Upload PDF File</h3>
        <FileUp />
      </div>
    </div>
  )
}

export default Fileupload