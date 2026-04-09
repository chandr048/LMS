import React from 'react'
import axios from 'axios'
import {assets} from '../../assets/assets.js'
import { Link } from 'react-router-dom'
import {useClerk,UserButton,useUser} from '@clerk/react'
import { AppContext } from '../../context/AppContext.jsx'
import { useContext } from 'react'
import { toast } from 'react-toastify'

function Navbar() {

  const{navigate,isEducator, backendUrl, setIsEducator, getToken} = useContext(AppContext)

  const isCourseListPage = location.pathname.includes('/courses-list');

  const{openSignIn}= useClerk()
  const{user}= useUser()

  const becomeEducator = async()=>{
    console.log('Become Educator clicked', { isEducator, backendUrl })
    try{
      if(isEducator){
        navigate('/educator')
        return;
      }
      const token = await getToken()
      console.log('Educator token', token)
      const {data} = await axios.post(backendUrl + "/api/educator/update-role", {}, {
        headers: {Authorization: `Bearer ${token}`}
      })

      if(data.success){
        setIsEducator(true)
        toast.success(data.message)
      }else{
        toast.error(data.message)
      }

    } catch(error){
      console.log(error)
      toast.error(error.message || 'Unable to become educator')
    }
  }

  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4  ${isCourseListPage ? 'bg-white-100' : 'bg-linear-to-b from-cyan-100/70'}`}>
      <img onClick={()=> navigate('/')}src={assets.logo} alt="Logo" className='w-28 lg:w-32 cursor-pointer'/>
      <div className='hidden md:flex items-center gap-5 text-gray-500'>
        <div className='flex items-center gap-5'>
          {user && 
          <>
            <button type="button" className="cursor-pointer" onClick={becomeEducator}>{isEducator ? 'Educator Dashboard' : 'Become Educator'}</button>
            | <Link to="/my-enrollments">My Enrollments</Link>
            </>
            }
        </div>
    { user ? <UserButton/> :
      
      <button onClick={()=> openSignIn()}className='bg-blue-600 text-white px-5 py-2 ml-200 rounded-full'>Create Account </button>}
    </div>
        {/* For phone Screen  */}
        <div className='md:hidden flex items-center gap-2 sm:gap-5 text-gray-500'>
           <div className='flex items-center gap-1 sm:gap-2 text-gray-500'>
          { user && 
          <>
            <button type="button" className="cursor-pointer" onClick={becomeEducator}>{isEducator ? 'Educator Dashboard' : 'Become Educator'}</button>
            | <Link to="/my-enrollments">My Enrollments</Link>
            </>
            }
        </div>
        {
          user ? <UserButton/> :
          <button onClick={()=> openSignIn()}><img src={assets.user_icon} alt=""/></button>
        }
        
        </div>
    </div>
  )
}

export default Navbar;
