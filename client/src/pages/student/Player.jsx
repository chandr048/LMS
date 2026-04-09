import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { useParams } from 'react-router-dom'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import YouTube from 'react-youtube'
import Footer from '../../components/students/Footer'
import Rating from '../../components/students/Rating'
import { toast } from 'react-toastify'
import Loading from '../../components/Loading'
import axios from 'axios'

function Player() {

  const {
    enrolledCourses,
    calculateChapterTime,
    backendUrl,
    getToken,
    userData,
    fetchUserEnrolledCourses
  } = useContext(AppContext)

  const { courseId } = useParams()

  const [courseData, setCourseData] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [playerData, setPlayerData] = useState(null)
  const [progressData, setProgressData] = useState(null)
  const [initialRating, setInitialRating] = useState(0)

  // ✅ Get course + rating
  const getCourseData = () => {
    const course = enrolledCourses.find(c => c._id === courseId)

    if (course) {
      setCourseData(course)

      const userRating = course.courseRatings?.find(
        r => r.userId === userData?._id
      )

      if (userRating) {
        setInitialRating(userRating.rating)
      }
    }
  }

  const toggleSection = (index) => {
    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseData()
    }
  }, [enrolledCourses])

  // ✅ Mark lecture complete
  const markLectureAsCompleted = async (lectureId) => {
    try {
      const token = await getToken()

      const { data } = await axios.post(
        `${backendUrl}/api/user/update-course-progress`,
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        getCourseProgress()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  // ✅ Get progress
  const getCourseProgress = async () => {
    try {
      const token = await getToken()

      const { data } = await axios.post(
        `${backendUrl}/api/user/get-course-progress`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setProgressData(data.progressData)
      } else {
        toast.error('Failed to load progress')
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  // ✅ Handle rating
  const handleRate = async (rating) => {
    try {
      const token = await getToken()

      const { data } = await axios.post(
        `${backendUrl}/api/user/add-rating`,
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        fetchUserEnrolledCourses()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    getCourseProgress()
  }, [])

  return courseData ? (
    <>
      <div className='p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36'>

        {/* LEFT */}
        <div className='text-gray-800'>
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

                <div className={`${openSections[index] ? 'block' : 'hidden'}`}>
                  <ul className='list-disc pl-6 py-2 text-gray-600 border-t'>
                    {chapter.chapterContent.map((lecture, i) => (
                      <li key={i} className='flex gap-2 py-1'>

                        <img
                          src={
                            progressData?.lectureCompleted?.includes(lecture._id)
                              ? assets.blue_tick_icon
                              : assets.play_icon
                          }
                          className='w-4 h-4 mt-1'
                        />

                        <div className='flex justify-between w-full text-xs'>
                          <p>{lecture.lectureTitle}</p>

                          <div className='flex gap-2'>
                            {lecture.lectureUrl && (
                              <p
                                onClick={() =>
                                  setPlayerData({
                                    ...lecture,
                                    chapter: index + 1,
                                    lecture: i + 1,
                                  })
                                }
                                className='text-blue-500 cursor-pointer'
                              >
                                Watch
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

          {/* Rating */}
          <div className='flex items-center gap-2 py-3 mt-10'>
            <h1 className='text-xl font-bold'>Rate this course</h1>
            <Rating initialRating={initialRating} onRate={handleRate} />
          </div>
        </div>

        {/* RIGHT */}
        <div className='md:mt-10'>
          {playerData ? (
            <div>
              <YouTube
                videoId={playerData.lectureUrl.split('/').pop()}
                iframeClassName='w-full aspect-video'
              />

              <div className='flex justify-between mt-1'>
                <p>
                  {playerData.chapter}.{playerData.lecture}{' '}
                  {playerData.lectureTitle}
                </p>

                <button
                  onClick={() =>
                    markLectureAsCompleted(playerData._id)
                  }
                  className='text-blue-600'
                >
                  {progressData?.lectureCompleted?.includes(playerData._id)
                    ? 'Completed'
                    : 'Mark Complete'}
                </button>
              </div>
            </div>
          ) : (
            <img src={courseData.courseThumbnail} alt="" />
          )}
        </div>

      </div>

      <Footer />
    </>
  ) : <Loading />
}

export default Player