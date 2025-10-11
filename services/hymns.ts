export interface Hymn {
  id: number;
  title: string;
  lyrics: string;
  audioUrl: string;
}

export const hymns: Hymn[] = [
  {
    id: 1,
    title: 'Amazing Grace',
    lyrics: `Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found;
Was blind, but now I see.

’Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed.

Through many dangers, toils and snares,
I have already come;
’Tis grace hath brought me safe thus far,
And grace will lead me home.

The Lord has promised good to me,
His Word my hope secures;
He will my Shield and Portion be,
As long as life endures.`,
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Amazing_Grace_by_the_US_Air_Force_Band_Strolling_Strings.mp3',
  },
  {
    id: 2,
    title: 'To God Be The Glory',
    lyrics: `To God be the glory, great things He hath done;
So loved He the world that He gave us His Son,
Who yielded His life an atonement for sin,
And opened the life gate that all may go in.

Praise the Lord, praise the Lord,
Let the earth hear His voice!
Praise the Lord, praise the Lord,
Let the people rejoice!
O come to the Father, through Jesus the Son,
And give Him the glory, great things He hath done.

O perfect redemption, the purchase of blood,
To every believer the promise of God;
The vilest offender who truly believes,
That moment from Jesus a pardon receives.

Great things He hath taught us, great things He hath done,
And great our rejoicing through Jesus the Son;
But purer, and higher, and greater will be
Our wonder, our transport, when Jesus we see.`,
    audioUrl: 'https://www.hymnal.net/Hymns/Hymnal/mp3/h0039.mp3',
  },
  {
    id: 3,
    title: 'Great Is Thy Faithfulness',
    lyrics: `Great is Thy faithfulness, O God my Father,
There is no shadow of turning with Thee;
Thou changest not, Thy compassions, they fail not
As Thou hast been Thou forever wilt be.

Great is Thy faithfulness!
Great is Thy faithfulness!
Morning by morning new mercies I see;
All I have needed Thy hand hath provided—
Great is Thy faithfulness, Lord, unto me!

Summer and winter, and springtime and harvest,
Sun, moon and stars in their courses above,
Join with all nature in manifold witness
To Thy great faithfulness, mercy and love.

Pardon for sin and a peace that endureth,
Thine own dear presence to cheer and to guide;
Strength for today and bright hope for tomorrow,
Blessings all mine, with ten thousand beside!`,
    audioUrl: 'https://www.hymnal.net/Hymns/Hymnal/mp3/h0030.mp3',
  },
  {
    id: 4,
    title: 'How Great Thou Art',
    lyrics: `O Lord my God, when I in awesome wonder
Consider all the worlds Thy hands have made,
I see the stars, I hear the rolling thunder,
Thy power throughout the universe displayed.

Then sings my soul, my Savior God, to Thee,
How great Thou art, how great Thou art!
Then sings my soul, my Savior God, to Thee,
How great Thou art, how great Thou art!

And when I think that God, His Son not sparing,
Sent Him to die, I scarce can take it in,
That on the cross, my burden gladly bearing,
He bled and died to take away my sin.

When Christ shall come with shout of acclamation
And take me home, what joy shall fill my heart!
Then I shall bow in humble adoration
And there proclaim, my God, how great Thou art!`,
    audioUrl: 'https://www.hymnal.net/Hymns/Hymnal/mp3/h0077.mp3',
  },
  {
    id: 5,
    title: 'Blessed Assurance',
    lyrics: `Blessed assurance, Jesus is mine!
O what a foretaste of glory divine!
Heir of salvation, purchase of God,
Born of His Spirit, washed in His blood.

This is my story, this is my song,
Praising my Savior all the day long;
This is my story, this is my song,
Praising my Savior all the day long.

Perfect submission, perfect delight,
Visions of rapture now burst on my sight;
Angels, descending, bring from above
Echoes of mercy, whispers of love.

Perfect submission, all is at rest,
I in my Savior am happy and blest;
Watching and waiting, looking above,
Filled with His goodness, lost in His love.`,
    audioUrl: 'https://www.hymnal.net/Hymns/Hymnal/mp3/h0572.mp3',
  },
];