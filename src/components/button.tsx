export default function Button(props: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div className="rounded-md shadow-sm">
      <button
        type="button"
        className="px-4 py-2 my-4 w-64 text-sm font-medium text-gray-900 border border-gray-200 rounded-e-lg rounded-s-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
        onClick={props.onClick}
      >
        {props.children}
      </button>
    </div>
  )
}
