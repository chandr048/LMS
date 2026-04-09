import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/Loading'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import Footer from '../../components/students/Footer'
import YouTube from 'react-youtube'
import { toast } from 'react-toastify'
import axios from 'axios'

function CourseDetails() {

  const { id } = useParams()

  const [courseData, setCourseData] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false)
  const [playerData, setPlayerData] = useState(null)

  const {
    calculateRating,
    calculateNoOfLectures,
    calculateCourseDuration,
    calculateChapterTime,
    currency,
    backendUrl,
    userData,
    getToken
  } = useContext(AppContext)

  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/course/${id}`)

      if (data.success) {
        setCourseData(data.course)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to fetch course data')
    }
  }

  const enrollCourse = async () => {
    try {
      if (!userData) return toast.warn('Login to Enroll')
      if (isAlreadyEnrolled) return toast.info('Already enrolled')

      const token = await getToken()

      const { data } = await axios.post(
        `${backendUrl}/api/user/purchase`,
        { courseId: courseData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        window.location.replace(data.session_url)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to enroll in course')
    }
  }

  useEffect(() => {
    fetchCourseData()
  }, [id])

  useEffect(() => {
    if (userData && courseData) {
      setIsAlreadyEnrolled(
        userData.enrolledCourses?.includes(courseData._id)
      )
    }
  }, [userData, courseData])

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  return courseData ? (
    <>
      <div className='flex md:flex-row flex-col-reverse gap-10 relative items-start 
      justify-between md:px-36 px-8 md:pt-30 pt-20 text-left'>

        <div className='absolute top-0 left-0 w-full h-section-height -z-10 bg-gradient-to-b from-cyan-100/70'></div>

        {/* LEFT */}
        <div className='max-w-xl z-10 text-gray-500'>

          <h1 className='md:text-3xl text-xl font-semibold text-gray-800'>
            {courseData.courseTitle}
          </h1>

          <p
            className='pt-4 md:text-base text-sm'
            dangerouslySetInnerHTML={{
              __html: courseData.courseDescription?.slice(0, 200),
            }}
          />

          {/* Ratings */}
          <div className='flex items-center space-x-2 pt-3 pb-1 text-sm'>
            <p>{calculateRating(courseData)}</p>

            <div className='flex'>
              {[...Array(5)].map((_, i) => (
                <img
                  key={i}
                  src={
                    i < Math.floor(calculateRating(courseData))
                      ? assets.star
                      : assets.star_blank
                  }
                  alt=""
                  className='w-3.5 h-3.5'
                />
              ))}
            </div>

            <p className='text-blue-600'>
              ({courseData.courseRatings?.length}{' '}
              {courseData.courseRatings?.length > 1 ? 'ratings' : 'rating'})
            </p>

            <p>
              {courseData.enrolledStudents?.length}{' '}
              {courseData.enrolledStudents?.length > 1
                ? 'students'
                : 'student'}
            </p>
          </div>

          <p className='text-sm'>
            Course by{' '}
            <span className='text-blue-600 underline'>
              {courseData.educator?.name}
            </span>
          </p>

          {/* Course Structure */}
          <div className='pt-8 text-gray-800'>
            <h2 className='text-xl font-semibold'>Course Structure</h2>

            <div className='pt-5'>
              {courseData.courseContent?.map((chapter, index) => (
                <div key={index} className='border bg-white mb-2 rounded'>

                  <div
                    className='flex justify-between px-4 py-3 cursor-pointer'
                    onClick={() => toggleSection(index)}
                  >
                    <div className='flex items-center gap-2'>
                      <img
                        className={`transition-transform ${
                          openSections[index] ? 'rotate-180' : ''
                        }`}
                        src={assets.down_arrow_icon}
                        alt=""
                      />
                      <p className='font-medium text-sm md:text-base'>
                        {chapter.chapterTitle}
                      </p>
                    </div>

                    <p className='text-sm'>
                      {chapter.chapterContent.length} lectures -{' '}
                      {calculateChapterTime(chapter)}
                    </p>
                  </div>

                  <div
                    className={`overflow-hidden transition-all ${
                      openSections[index] ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <ul className='list-disc pl-6 py-2 text-gray-600 border-t'>
                      {chapter.chapterContent.map((lecture, i) => (
                        <li key={i} className='flex gap-2 py-1'>
                          <img src={assets.play_icon} className='w-4 h-4 mt-1' />

                          <div className='flex justify-between w-full text-xs'>
                            <p>{lecture.lectureTitle}</p>

                            <div className='flex gap-2'>
                              {lecture.isPreviewFree && (
                                <p
                                  onClick={() =>
                                    setPlayerData({
                                      videoId: lecture.lectureUrl.split('/').pop(),
                                    })
                                  }
                                  className='text-blue-500 cursor-pointer'
                                >
                                  Preview
                                </p>
                              )}

                              <p>
                                {humanizeDuration(
                                  lecture.lectureDuration * 60 * 1000,
                                  { units: ['h', 'm'] }
                                )}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className='py-20'>
            <h3 className='text-xl font-semibold text-gray-800'>
              Course Description
            </h3>

            <p
              className='pt-3'
              dangerouslySetInnerHTML={{
                __html: courseData.courseDescription,
              }}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className='shadow rounded overflow-hidden bg-white min-w-[300px]'>

          {playerData ? (
            <YouTube
              videoId={playerData.videoId}
              opts={{ playerVars: { autoplay: 1 } }}
              iframeClassName='w-full aspect-video'
            />
          ) : (
            <img src={courseData.courseThumbnail} alt="" />
          )}

          <div className='p-5'>

            <div className='flex gap-3 items-center'>
              <p className='text-2xl font-semibold'>
                {currency}
                {(
                  courseData.coursePrice -
                  (courseData.discount * courseData.coursePrice) / 100
                ).toFixed(2)}
              </p>
              <p className='line-through'>{currency}{courseData.coursePrice}</p>
            </div>

            <button
              onClick={enrollCourse}
              className='mt-4 w-full py-3 bg-blue-600 text-white rounded'
            >
              {isAlreadyEnrolled ? 'Already Enrolled' : 'Enroll Now'}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  ) : <Loading />
}

export default CourseDetails