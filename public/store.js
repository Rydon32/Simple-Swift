document.addEventListener("DOMContentLoaded", () => {
    let cart = {};
    let totalItems = 0; // Keep track of the total number of items
    const updateCartCount = () => {
        document.getElementById('cartCount').textContent = totalItems;
    };
    //function to update cart dropdown menu
    const updateCartDropdown = () => {
        const dropdown = document.getElementById('cartDropdown');
        dropdown.innerHTML = ''; // Clear current dropdown contents
    
        if (totalItems === 0) {
            dropdown.innerHTML = '<li><a class="dropdown-item" href="#">No items in cart</a></li>';
        } else {
            Object.values(cart).forEach((item, index) => {
                const itemElement = document.createElement('li');
                const link = document.createElement('a');
                link.href = '#';
                link.className = 'dropdown-item';
                link.textContent = ` ${item.name}: ${item.quantity} `;

                const itemImg = document.createElement('img')
                itemImg.src= `${item.imgSrc}`
                itemImg.className= "dropdown-img"
    
                // Create Remove Button
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.className = 'btn btn-danger btn-sm';
                removeBtn.style.marginLeft = '10px';


                
                // Attach event listener to Remove Button
                removeBtn.onclick = function() {
                    event.stopPropagation();
                    if (cart[item.id].quantity > 1) {
                        cart[item.id].quantity -= 1;
                    } else {
                        delete cart[item.id];
                    }
                    totalItems -= 1;
                    updateCartCount();
                    updateCartDropdown();
                };


                link.appendChild(removeBtn);
                itemElement.appendChild(link);
                link.prepend(itemImg);
                dropdown.appendChild(itemElement);

            });
            //create dropdown buttons
            const checkoutDiv = document.createElement('div')
            checkoutDiv.className="text-center mt-4"
            const checkoutBtn = document.createElement('button');
            checkoutBtn.textContent = 'Checkout';
            checkoutBtn.className = 'btn btn-primary btn-sm checkoutButton centered';
            checkoutBtn.style.marginLeft = '10px';
            checkoutBtn.addEventListener("click", () => {
                if (Object.keys(cart).length === 0) {
                    alert("Your cart is empty.");
                    return;
                }
                const itemsArray = Object.values(cart).map(item => ({
                    id: item.id.toString(),
                    quantity: item.quantity
                }));
                fetch("/create-checkout-session", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ items: itemsArray }),
                })
                .then(response => response.json())
                .then(data => {
                    if(data.url) {
                        window.location.href = data.url;
                    } else {
                        console.error("Checkout URL not provided.");
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                });
            });

            dropdown.appendChild(checkoutDiv);
            checkoutDiv.appendChild(checkoutBtn);
        }
    };

    

//Create add to cart button functionality
    document.querySelectorAll('.addToCartButton').forEach(button => {
        button.addEventListener('click', () => {
            const itemId = parseInt(button.getAttribute('data-id'), 10);
            const itemName = button.getAttribute('data-name');
            const imgSrc = button.getAttribute('img-src')
            if (!cart[itemId]) {
                cart[itemId] = { id: itemId, name: itemName, quantity: 0, imgSrc: imgSrc };
            }
            cart[itemId].quantity += 1;
            totalItems += 1;
            updateCartCount(); 
            updateCartDropdown();
            console.log(cart);
        });
    });

    //Create checkout button functionality
    document.querySelector(".checkoutButton").addEventListener("click", () => {
        if (Object.keys(cart).length === 0) {
            alert("Your cart is empty.");
            return;
        }

        const itemsArray = Object.values(cart).map(item => ({
            id: item.id.toString(),
            quantity: item.quantity
        }));
        

        fetch("/create-checkout-session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ items: itemsArray }),
        })
        .then(response => response.json())
        .then(data => {
            if(data.url) {
                window.location.href = data.url;
            } else {
                console.error("Checkout URL not provided.");
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
    });

    document.querySelector("form[role='search']").addEventListener("submit", function(event) {
        event.preventDefault();
        
        const searchTerm = document.querySelector("input[type='search']").value.toLowerCase();

        const filteredItems = Object.values(cart).filter(item => item.name.toLowerCase().includes(searchTerm));

        // Function to display filtered items
        const displaySearchResults = (items) => {
            const resultsContainer = document.getElementById("searchResults");
            resultsContainer.innerHTML = '';
            if (items.length > 0) {
                items.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.textContent = `${item.name}: ${item.quantity}`;
                    resultsContainer.appendChild(itemElement);
                });
            } else {
                resultsContainer.innerHTML = '<p>No items found.</p>';
            }
        };

        displaySearchResults(filteredItems);
    });

});


