export default function Link(props: {
  children: React.ReactNode
  href: string
}) {
  return (
    <a
      href={props.href}
      className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
      target="_blank"
    >
      {props.children}
    </a>
  )
}
