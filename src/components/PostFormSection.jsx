import React from 'react'
import { PostForm } from './PostForm'

export function PostFormSection() {
  const handleSuccess = () => {
    const marketplace = document.getElementById('marketplace')
    if (marketplace) {
      marketplace.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="post-section">
      <div className="section-wrap">
        <div className="section-header">
          <div className="section-tag">// post ad</div>
          <h2>Create a Listing</h2>
        </div>
        <PostForm onSuccess={handleSuccess} />
      </div>
    </section>
  )
}
