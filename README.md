# OgJs
Is a set of libraries in for JavaScript to interact with API's as resources and collections.

## But, what?

```javascript

// You can turn this
const data = {
 name: 'John'
}

const user = axios.post('/api/path', data)


// Into this

const user = new User(api, { name: 'John' })

user.save();

```

```javascript
// Also you can query like this:
const user = new User(api, { name: 'John' });

user.where('email', 'john.doe@example.com').find();

// Or fail if negative response
try {
   user.findOrFail();
 } catch() {
   console.log(user.response.message);
 }
