// Create a global variable to tell us whether the user has voted
// The best_parade_photo_vote item is set in localStorage when the user votes on a photo
// When the user has not voted, userHasVoted will be null
let userHasVoted = localStorage.getItem("best_parade_photo_vote");

// Get a reference to the total votes ref
const totalVotesRef = database.ref('total_votes');

$(document).ready(() => {
    // Initialize totalVotes ref to 0 no one has voted before
    totalVotesRef.once('value')
        .then(totalVotesSnapshot => {
            if (totalVotesSnapshot.val() === null) {
                totalVotesRef.set(0);
            }
        })

    // Static array of 2019 Pride Parade Photos to vote from
    const paradePhotos = [{
            id: "photo_friends_who_love_love",
            name: "Friends who love LOVE",
            srcUrl: "https://images.scribblelive.com/2019/8/31/e4d80602-c0fc-4122-ab89-441e83ce962f.jpg",
            altText: "Friends who love LOVE 2019 Pride Parade photo"

        },
        {
            id: "photo_pride_colors_police_car",
            name: "Pride colors Police car",
            srcUrl: "https://images.scribblelive.com/2019/8/31/667911d7-2f7a-4de7-af46-bc61c2c163e3.jpg",
            altText: "Pride colors Police car 2019 Pride Parade photo"

        },
        {
            id: "photo_love_is_a_terrible_thing_to_hate",
            name: "Love Is a Terrible Thing to Hate",
            srcUrl: "https://images.scribblelive.com/2019/8/31/f9a08979-b783-47db-8cb3-ff8c86aa576f.jpg",
            altText: "Love Is a Terrible Thing to Hate 2019 Pride Parade photo"

        },
        {
            id: "photo_winston_and_greg",
            name: "Winston and Greg",
            srcUrl: "https://images.scribblelive.com/2019/8/31/b2842646-d731-4491-bfc8-e58d7662ab10.jpg",
            altText: "Winston and Greg 2019 Pride Parade photo"

        },
        {
            id: "photo_love_line",
            name: "Love line",
            srcUrl: "https://images.scribblelive.com/2019/8/31/12a02c0a-081d-4369-89a3-e1196e0d8154.jpg",
            altText: "Love line 2019 Pride Parade photo"

        },
        {
            id: "photo_the_future_is_equal",
            name: "THE FUTURE IS EQUAL",
            srcUrl: "https://images.scribblelive.com/2019/8/31/a9afe71f-a7ab-40ae-a087-5a85ac7b25d6.jpg",
            altText: "THE FUTURE IS EQUAL  2019 Pride Parade photo"

        }
    ];

    // Load parade photos for the first time and every time there is an update
    database.ref().on('value', () => {
        loadParadePhotos(paradePhotos)
    })

    /*
    // To re-order photos by votes
    database.ref('photos').on('value', (photosSnapshot) => {
        if (photosSnapshot === null) {
            // Use the original array with no votes
            loadParadePhotos(paradePhotos)
        } else {
            // photoVotes is an object with photo ids as keys
            const photosVotes = photosSnapshot.val()

            // Loop over the original array to add votes and sort them by votes
            const paradePhotosWithVotes = paradePhotos.map(photo => {
                return {
                    ...photo,
                    ...photosVotes[photo.id]
                }
            })

            paradePhotosWithVotes.sort((photo1, photo2) => photo2.votes - photo1.votes);
            loadParadePhotos(paradePhotosWithVotes)
        }
    })
    */


    // listen to clicking on vote button
    $('#container').on('click', '.vote_btn', event => {
        // Stop the click event from bubbling up
        event.stopPropagation();

        // Set best_parade_photo_vote in localstorage and indicate that the user has already voted
        localStorage.setItem('best_parade_photo_vote', 'voted');
        userHasVoted = "voted";

        // click event current target is the .vote_btn
        // We gave .vote_btn the data attribute as the unique id in the paradePhotosArray so that we can easily look up the information of the clicked photo

        //Use jQuery to get the photo unique id from the click event current target
        const photoId = $(event.currentTarget).attr('data');

        // Get the total number of votes once from Firebase and tell Firebase to increment that number by 1
        totalVotesRef.once('value')
            .then(totalVotesSnapshot => {
                const totalVotes = totalVotesSnapshot.val();

                totalVotesRef.set(totalVotes + 1)

            })
            .then(() => {
                // Get the photos/photoId ref's number of votes once from Firebase 
                return database.ref(`photos/${photoId}`).once('value')
            })
            .then(photoVotesSnapshot => {
                // Tell Firebase to increment the photo number of votes by 1
                const photoVotes = photoVotesSnapshot.val().votes;
                database.ref(`photos/${photoId}`).set({
                    votes: photoVotes + 1
                })
            })
            .then(() => {
                // When Firebase has finished updating the votes, reload the parade photos
                loadParadePhotos(paradePhotos);
            })
    })

})

function loadParadePhotos(photos) {
    // Remove div#photos_container if we already have one
    if ($('#photos_container').length !== 0) {
        $('#photos_container').remove();
    }

    // Use jQuery to create div#photos_container
    const photosContainer = $('<div></div>').attr('id', 'photos_container');

    // Loop through parade photos and for each photo:
    // Use jQuery to create a div.photo_container
    // Inside the photo_container append p.photo_name img.photo and a vote button (with the id of the photo as the button data attribute)
    // Use jQuery to append div.photo_container to div#photos_container
    photos.map(photo => {
        const photoContainer = $('<div></div>').addClass('photo_container')

        const photoName = $('<p></p>').addClass('photo_name').text(photo.name);

        const img = $('<img/>').addClass('photo').attr('src', photo.srcUrl).attr('alt', photo.altText);

        photoContainer.append(photoName, [img]);

        // Only show vote button if user has not voted yet
        if (!userHasVoted) {
            const voteBtnContainer = $('<div></div>').addClass('vote_btn_container');

            const voteBtn = $('<button></button>').addClass('btn btn-primary vote_btn').attr('type', 'button').text('Vote');

            // Give data attr of photo id so that we can know which photo was clicked
            voteBtn.attr('data', `${photo.id}`)

            // Append voteBtn to voteBtnContainer
            voteBtnContainer.append(voteBtn);

            // Append voteBtnContainer to photoContainer
            photoContainer.append(voteBtnContainer);

            // Initialize firebase photos/photoId ref's votes to 0 if no one has voted on this photo before
            database.ref(`photos/${photo.id}`).once('value')
                .then(photoVotesSnapshot => {
                    if (photoVotesSnapshot.val() === null) {
                        database.ref(`photos/${photo.id}`).set({
                            votes: 0
                        });
                    }
                })

        } else {
            // Otherwise show photo votes results
            const votesResultsContainer = $('<div></div>').addClass('votes_results_container')

            const votesResults = $('<div></div>').addClass('votes_results');

            // Get total votes and photo votes results from Firebase and use jQuery to add those votes results as text to votesResults
            totalVotesRef.once('value')
                .then(totalVotesSnapshot => {
                    const totalVotes = totalVotesSnapshot.val();

                    database.ref(`photos/${photo.id}`).once('value')
                        .then(photoVotesSnapshot => {
                            const photoVotes = photoVotesSnapshot.val().votes;

                            votesResults.text(`${photoVotes} out of ${totalVotes} votes`);
                        })
                })

            // Append votesResults to votesResultsContainer
            votesResultsContainer.append(votesResults)

            // Append votesResultsContainer to photoContainer
            photoContainer.append(votesResultsContainer)
        }

        photosContainer.append(photoContainer);
    })

    // Use jQuery to append div.photo_container to div#container
    $('#container').append(photosContainer);

}