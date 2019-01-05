# Hello World!
## Take a look at these things...

* [Animated Checkpoints!](animated-check/example.html)  
  Forked from [A-Frame extras](https://github.com/donmccurdy/aframe-extras).

* [A-Frame link](link/example.html)
  
  **Note:** The **a-link** primative does not provide mappings for all the properties - Is this also the case for other primatives?  
``` JavaScript
  mappings: {
    href: 'link.href',
    image: 'link.image',
    title: 'link.title'
  }
```

Could we have 'auto-mapping'?  
So hypanated properties map to camelCase properties of the component.  
`border-color` maps to `link.borderColor`

Loop round the Component.schema?

**More investigation needed?**